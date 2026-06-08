// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { RewardEscrow } from "../src/RewardEscrow.sol";
import { SelfHumanVerifier } from "../src/SelfHumanVerifier.sol";
import { MockSelfHub } from "../test/mocks/MockSelfHub.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice One-command testnet deploy of the full ProofPoll stack on Celo Sepolia (chain 11142220).
/// @dev Deploys MockSelfHub (testnet personhood Hub — Self uses mock passports on testnet anyway),
///      SelfHumanVerifier (the real adapter), and RewardEscrow, all wired together. For mainnet,
///      use `Deploy.s.sol` with `VERIFIER` pointed at a SelfHumanVerifier constructed against
///      Self's real Hub V2 (`0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`).
///
///      Run:
///        forge script script/DeployTestnet.s.sol \
///          --rpc-url celo_sepolia --broadcast \
///          --keystore <keystore> --sender <addr>
contract DeployTestnet is Script {
    // cUSD (Mento Dollar) on Celo Sepolia.
    address internal constant SEPOLIA_CUSD = 0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80;

    function run() external returns (MockSelfHub hub, SelfHumanVerifier verifier, RewardEscrow escrow) {
        address payToken = vm.envOr("PAY_TOKEN", SEPOLIA_CUSD);
        string memory scopeSeed = vm.envOr("SELF_SCOPE_SEED", string("proofpoll"));

        vm.startBroadcast();
        hub = new MockSelfHub();
        verifier = new SelfHumanVerifier(address(hub), scopeSeed);
        escrow = new RewardEscrow(IERC20(payToken), verifier);
        vm.stopBroadcast();

        console2.log("== ProofPoll testnet stack (Celo Sepolia) ==");
        console2.log("MockSelfHub:       ", address(hub));
        console2.log("SelfHumanVerifier: ", address(verifier));
        console2.log("RewardEscrow:      ", address(escrow));
        console2.log("payToken (cUSD):   ", payToken);
    }
}
