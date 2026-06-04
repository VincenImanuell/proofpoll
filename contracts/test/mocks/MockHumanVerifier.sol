// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IHumanVerifier } from "../../src/interfaces/IHumanVerifier.sol";

/// @notice Test double for a proof-of-personhood verifier.
/// @dev Maps each subject address to a preset nullifier so tests can model:
///      - an *unverified* address (no nullifier set => revert), and
///      - one *human* controlling several wallets (same nullifier from many addresses).
contract MockHumanVerifier is IHumanVerifier {
    error NotVerified();

    mapping(address => uint256) public nullifierOf;
    mapping(address => bool) public verified;

    /// @notice Register `subject` as a verified human identified by `nullifier`.
    function setHuman(address subject, uint256 nullifier) external {
        verified[subject] = true;
        nullifierOf[subject] = nullifier;
    }

    function verify(address subject, bytes calldata) external view returns (uint256) {
        if (!verified[subject]) revert NotVerified();
        return nullifierOf[subject];
    }
}
