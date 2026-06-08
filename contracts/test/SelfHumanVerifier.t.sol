// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { SelfHumanVerifier } from "../src/SelfHumanVerifier.sol";
import { SelfVerificationRootStub } from "../src/self/SelfVerificationRootStub.sol";
import { SelfTypes } from "../src/self/SelfTypes.sol";
import { RewardEscrow } from "../src/RewardEscrow.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockSelfHub } from "./mocks/MockSelfHub.sol";

contract SelfHumanVerifierTest is Test {
    MockSelfHub internal hub;
    SelfHumanVerifier internal verifier;

    address internal alice = makeAddr("alice");
    address internal aliceSecondWallet = makeAddr("aliceSecondWallet");
    address internal bob = makeAddr("bob");

    uint256 internal constant ALICE_NULLIFIER = 0xA11CE;
    uint256 internal constant BOB_NULLIFIER = 0xB0B;

    function setUp() public {
        hub = new MockSelfHub();
        verifier = new SelfHumanVerifier(address(hub), "proofpoll");
    }

    /* ------------------------------- adapter unit ------------------------------- */

    function test_Constructor_SetsHubAndScope() public view {
        assertEq(verifier.hub(), address(hub));
        assertTrue(verifier.scope() != 0);
    }

    function test_HubCallback_BindsWalletToNullifier() public {
        vm.expectEmit(true, true, false, true);
        emit SelfHumanVerifier.HumanVerified(alice, ALICE_NULLIFIER);
        hub.pushHuman(address(verifier), alice, ALICE_NULLIFIER);

        assertTrue(verifier.isHuman(alice));
        assertEq(verifier.nullifierOf(alice), ALICE_NULLIFIER);
        assertEq(verifier.verify(alice, ""), ALICE_NULLIFIER);
    }

    function test_Verify_RevertIfWalletNeverVerified() public {
        vm.expectRevert(SelfHumanVerifier.NotVerified.selector);
        verifier.verify(bob, "");
    }

    function test_OnVerificationSuccess_RevertIfCallerIsNotHub() public {
        SelfTypes.GenericDiscloseOutputV2 memory output;
        output.userIdentifier = uint256(uint160(alice));
        output.nullifier = ALICE_NULLIFIER;

        // A stranger (not the Hub) cannot forge a verification.
        vm.prank(makeAddr("attacker"));
        vm.expectRevert(SelfVerificationRootStub.OnlyHub.selector);
        verifier.onVerificationSuccess(abi.encode(output), "");
    }

    function test_Sybil_SameHumanManyWallets_ShareOneNullifier() public {
        hub.pushHuman(address(verifier), alice, ALICE_NULLIFIER);
        hub.pushHuman(address(verifier), aliceSecondWallet, ALICE_NULLIFIER);

        // Two distinct wallets, but the same human => the same nullifier.
        assertEq(verifier.verify(alice, ""), ALICE_NULLIFIER);
        assertEq(verifier.verify(aliceSecondWallet, ""), ALICE_NULLIFIER);
    }

    function test_FullDisclosure_DecodesUserIdentifierToAddress() public {
        SelfTypes.GenericDiscloseOutputV2 memory output;
        output.attestationId = bytes32(uint256(1)); // passport
        output.userIdentifier = uint256(uint160(bob));
        output.nullifier = BOB_NULLIFIER;
        output.nationality = "NGA";
        output.olderThan = 18;

        hub.pushVerification(address(verifier), output, hex"1234");

        assertTrue(verifier.isHuman(bob));
        assertEq(verifier.nullifierOf(bob), BOB_NULLIFIER);
    }

    /* --------------------- integration with RewardEscrow ---------------------- */

    function test_Integration_VerifiedHumanGetsPaid_SybilBlockedAcrossWallets() public {
        MockERC20 cusd = new MockERC20();
        RewardEscrow escrow = new RewardEscrow(IERC20(address(cusd)), verifier);

        address organizer = makeAddr("organizer");
        uint96 reward = 0.5e18;
        uint64 max = 100;
        cusd.mint(organizer, uint256(reward) * max);
        vm.prank(organizer);
        cusd.approve(address(escrow), type(uint256).max);
        vm.prank(organizer);
        uint256 id = escrow.createSurvey(reward, max, keccak256("schema"));

        // Alice verifies with Self, then answers and is paid instantly.
        hub.pushHuman(address(verifier), alice, ALICE_NULLIFIER);
        vm.prank(alice);
        escrow.submitResponse(id, keccak256("answer"), "");
        assertEq(cusd.balanceOf(alice), reward);

        // The same human from a second verified wallet cannot claim again.
        hub.pushHuman(address(verifier), aliceSecondWallet, ALICE_NULLIFIER);
        vm.prank(aliceSecondWallet);
        vm.expectRevert(RewardEscrow.AlreadyResponded.selector);
        escrow.submitResponse(id, keccak256("answer"), "");
        assertEq(cusd.balanceOf(aliceSecondWallet), 0);

        // A different, unverified wallet is rejected by the verifier.
        vm.prank(bob);
        vm.expectRevert(SelfHumanVerifier.NotVerified.selector);
        escrow.submitResponse(id, keccak256("answer"), "");

        assertEq(escrow.getSurvey(id).responseCount, 1);
    }
}
