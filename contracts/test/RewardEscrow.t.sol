// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { RewardEscrow } from "../src/RewardEscrow.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockHumanVerifier } from "./mocks/MockHumanVerifier.sol";

contract RewardEscrowTest is Test {
    RewardEscrow internal escrow;
    MockERC20 internal cusd;
    MockHumanVerifier internal verifier;

    address internal organizer = makeAddr("organizer");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal aliceSecondWallet = makeAddr("aliceSecondWallet");

    uint96 internal constant REWARD = 0.5e18; // 0.5 cUSD
    uint64 internal constant MAX = 200;
    bytes32 internal constant SCHEMA = keccak256("Nigeria DeFi Sentiment Q2 2026");
    bytes32 internal constant RESP = keccak256("encrypted-answer+consent");

    function setUp() public {
        cusd = new MockERC20();
        verifier = new MockHumanVerifier();
        escrow = new RewardEscrow(IERC20(address(cusd)), verifier);

        // Fund the organizer and pre-approve the escrow.
        cusd.mint(organizer, 1_000e18);
        vm.prank(organizer);
        cusd.approve(address(escrow), type(uint256).max);

        // alice + bob are distinct verified humans; aliceSecondWallet is the same human as alice.
        verifier.setHuman(alice, 1111);
        verifier.setHuman(bob, 2222);
        verifier.setHuman(aliceSecondWallet, 1111);
    }

    function _create() internal returns (uint256 id) {
        vm.prank(organizer);
        id = escrow.createSurvey(REWARD, MAX, SCHEMA);
    }

    /* ------------------------------ createSurvey ------------------------------ */

    function test_CreateSurvey_EscrowsFundsAndStores() public {
        uint256 id = _create();

        assertEq(id, 0);
        assertEq(escrow.nextSurveyId(), 1);
        assertEq(cusd.balanceOf(address(escrow)), uint256(REWARD) * MAX);

        RewardEscrow.Survey memory s = escrow.getSurvey(id);
        assertEq(s.organizer, organizer);
        assertEq(s.rewardPerResponse, REWARD);
        assertEq(s.maxResponses, MAX);
        assertEq(s.responseCount, 0);
        assertEq(s.balance, uint256(REWARD) * MAX);
        assertEq(s.schemaHash, SCHEMA);
        assertTrue(s.open);
    }

    function test_CreateSurvey_RevertOnZeroParams() public {
        vm.startPrank(organizer);
        vm.expectRevert(RewardEscrow.InvalidParams.selector);
        escrow.createSurvey(0, MAX, SCHEMA);
        vm.expectRevert(RewardEscrow.InvalidParams.selector);
        escrow.createSurvey(REWARD, 0, SCHEMA);
        vm.stopPrank();
    }

    function test_CreateSurvey_RevertWhenPoolOverflowsUint128() public {
        vm.prank(organizer);
        vm.expectRevert(RewardEscrow.PoolTooLarge.selector);
        escrow.createSurvey(type(uint96).max, type(uint64).max, SCHEMA);
    }

    /* ----------------------------- submitResponse ----------------------------- */

    function test_SubmitResponse_PaysVerifiedHumanInstantly() public {
        uint256 id = _create();

        vm.expectEmit(true, true, true, true);
        emit RewardEscrow.ResponseSubmitted(id, alice, 1111, RESP, REWARD);
        vm.prank(alice);
        escrow.submitResponse(id, RESP, "");

        assertEq(cusd.balanceOf(alice), REWARD);
        assertEq(escrow.getSurvey(id).responseCount, 1);
        assertEq(escrow.getSurvey(id).balance, uint256(REWARD) * MAX - REWARD);
        assertTrue(escrow.hasResponded(id, 1111));
        assertEq(escrow.remainingSlots(id), MAX - 1);
    }

    function test_SubmitResponse_RevertIfNotVerifiedHuman() public {
        uint256 id = _create();
        address stranger = makeAddr("stranger"); // never registered with the verifier
        vm.prank(stranger);
        vm.expectRevert(MockHumanVerifier.NotVerified.selector);
        escrow.submitResponse(id, RESP, "");
    }

    function test_Sybil_SameHumanFromSecondWallet_CannotClaimTwice() public {
        uint256 id = _create();

        vm.prank(alice);
        escrow.submitResponse(id, RESP, "");

        // aliceSecondWallet is a different address but the same human (nullifier 1111).
        vm.prank(aliceSecondWallet);
        vm.expectRevert(RewardEscrow.AlreadyResponded.selector);
        escrow.submitResponse(id, RESP, "");

        assertEq(cusd.balanceOf(aliceSecondWallet), 0);
        assertEq(escrow.getSurvey(id).responseCount, 1);
    }

    function test_DistinctHumans_EachGetPaidOnce() public {
        uint256 id = _create();

        vm.prank(alice);
        escrow.submitResponse(id, RESP, "");
        vm.prank(bob);
        escrow.submitResponse(id, RESP, "");

        assertEq(cusd.balanceOf(alice), REWARD);
        assertEq(cusd.balanceOf(bob), REWARD);
        assertEq(escrow.getSurvey(id).responseCount, 2);
    }

    function test_SubmitResponse_AutoClosesAndRevertsWhenFull() public {
        // Small survey with exactly 2 slots.
        vm.prank(organizer);
        uint256 id = escrow.createSurvey(REWARD, 2, SCHEMA);

        vm.prank(alice);
        escrow.submitResponse(id, RESP, "");
        vm.prank(bob);
        escrow.submitResponse(id, RESP, "");

        assertFalse(escrow.getSurvey(id).open);
        assertEq(escrow.getSurvey(id).balance, 0);

        address carol = makeAddr("carol");
        verifier.setHuman(carol, 3333);
        vm.prank(carol);
        vm.expectRevert(RewardEscrow.SurveyNotOpen.selector);
        escrow.submitResponse(id, RESP, "");
    }

    /* ------------------------------ closeSurvey ------------------------------- */

    function test_CloseSurvey_RefundsRemainderToOrganizer() public {
        uint256 id = _create();
        vm.prank(alice);
        escrow.submitResponse(id, RESP, "");

        uint256 before = cusd.balanceOf(organizer);
        uint256 expectedRefund = uint256(REWARD) * MAX - REWARD;

        vm.expectEmit(true, false, false, true);
        emit RewardEscrow.SurveyClosed(id, expectedRefund);
        vm.prank(organizer);
        escrow.closeSurvey(id);

        assertEq(cusd.balanceOf(organizer), before + expectedRefund);
        assertEq(cusd.balanceOf(address(escrow)), 0);
        assertFalse(escrow.getSurvey(id).open);
    }

    function test_CloseSurvey_RevertIfNotOrganizer() public {
        uint256 id = _create();
        vm.prank(alice);
        vm.expectRevert(RewardEscrow.NotOrganizer.selector);
        escrow.closeSurvey(id);
    }

    function test_CloseSurvey_RevertIfAlreadyClosed() public {
        uint256 id = _create();
        vm.startPrank(organizer);
        escrow.closeSurvey(id);
        vm.expectRevert(RewardEscrow.SurveyNotOpen.selector);
        escrow.closeSurvey(id);
        vm.stopPrank();
    }

    /* -------------------------------- invariant ------------------------------- */

    /// @dev Fuzz: balance must always equal (maxResponses - responseCount) * reward.
    function testFuzz_BalanceAccountingHolds(uint8 responders) public {
        uint64 cap = 50;
        vm.prank(organizer);
        uint256 id = escrow.createSurvey(REWARD, cap, SCHEMA);

        uint256 n = uint256(responders) % cap; // stay within the cap
        for (uint256 i = 0; i < n; i++) {
            // forge-lint: disable-next-line(unsafe-typecast)
            address h = address(uint160(0x1000 + i));
            verifier.setHuman(h, 100_000 + i);
            vm.prank(h);
            escrow.submitResponse(id, RESP, "");
        }

        RewardEscrow.Survey memory s = escrow.getSurvey(id);
        assertEq(s.responseCount, n);
        assertEq(s.balance, uint256(REWARD) * (cap - n));
        assertEq(cusd.balanceOf(address(escrow)), s.balance);
    }
}
