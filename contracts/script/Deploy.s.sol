// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { RewardEscrow } from "../src/RewardEscrow.sol";
import { IHumanVerifier } from "../src/interfaces/IHumanVerifier.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Deploys RewardEscrow against a stablecoin + an already-deployed human verifier.
/// @dev Use this for mainnet (or any network where the verifier is deployed separately).
///      For a one-command Celo Sepolia testnet stack, use `DeployTestnet.s.sol` instead.
/// @dev Configure via env:
///   PAY_TOKEN  - stablecoin address (cUSD). Defaults to Celo Sepolia cUSD when unset.
///   VERIFIER   - deployed IHumanVerifier (Self adapter) address. Required.
/// Run: forge script script/Deploy.s.sol --rpc-url celo_sepolia --broadcast --verify
contract Deploy is Script {
    // cUSD (Mento Dollar) on Celo Sepolia testnet.
    address internal constant SEPOLIA_CUSD = 0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80;

    function run() external returns (RewardEscrow escrow) {
        address payToken = vm.envOr("PAY_TOKEN", SEPOLIA_CUSD);
        address verifier = vm.envAddress("VERIFIER");

        vm.startBroadcast();
        escrow = new RewardEscrow(IERC20(payToken), IHumanVerifier(verifier));
        vm.stopBroadcast();

        console2.log("RewardEscrow deployed at:", address(escrow));
        console2.log("  payToken:", payToken);
        console2.log("  verifier:", verifier);
    }
}
