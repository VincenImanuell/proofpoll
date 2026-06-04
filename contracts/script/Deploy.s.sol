// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { RewardEscrow } from "../src/RewardEscrow.sol";
import { IHumanVerifier } from "../src/interfaces/IHumanVerifier.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Deploys RewardEscrow against a stablecoin + a deployed human verifier.
/// @dev Configure via env:
///   PAY_TOKEN  - stablecoin address (cUSD). Defaults to Alfajores cUSD when unset.
///   VERIFIER   - deployed IHumanVerifier (Self adapter) address. Required.
/// Run: forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
contract Deploy is Script {
    // cUSD on Celo Alfajores testnet.
    address internal constant ALFAJORES_CUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function run() external returns (RewardEscrow escrow) {
        address payToken = vm.envOr("PAY_TOKEN", ALFAJORES_CUSD);
        address verifier = vm.envAddress("VERIFIER");

        vm.startBroadcast();
        escrow = new RewardEscrow(IERC20(payToken), IHumanVerifier(verifier));
        vm.stopBroadcast();

        console2.log("RewardEscrow deployed at:", address(escrow));
        console2.log("  payToken:", payToken);
        console2.log("  verifier:", verifier);
    }
}
