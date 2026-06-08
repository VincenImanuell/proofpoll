// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SelfTypes } from "../../src/self/SelfTypes.sol";
import { SelfVerificationRootStub } from "../../src/self/SelfVerificationRootStub.sol";

/// @notice Stand-in for the Self Identity Verification Hub.
/// @dev Self runs *mock passports* on testnet anyway; this hub plays that role on Celo Sepolia and
///      in tests. It delivers verification results exactly as the real Hub does — by calling
///      `onVerificationSuccess` on the adapter — so the adapter code path under test is the real one.
///      It performs **no** ZK verification (the real Hub does); never deploy it to mainnet.
contract MockSelfHub {
    /// @notice Deliver a full disclosure to a SelfVerificationRoot-style consumer.
    function pushVerification(
        address consumer,
        SelfTypes.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) public {
        SelfVerificationRootStub(consumer).onVerificationSuccess(abi.encode(output), userData);
    }

    /// @notice Convenience: register `subject` as a verified human identified by `nullifier`.
    function pushHuman(address consumer, address subject, uint256 nullifier) external {
        SelfTypes.GenericDiscloseOutputV2 memory output;
        output.userIdentifier = uint256(uint160(subject));
        output.nullifier = nullifier;
        pushVerification(consumer, output, "");
    }
}
