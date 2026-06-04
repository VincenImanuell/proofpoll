// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IHumanVerifier
/// @notice Abstraction over a proof-of-personhood verifier (Self Protocol in production).
/// @dev Implementations MUST revert if `proof` does not establish that `subject` is a
///      unique, real human under this application's scope. The returned `nullifier` is a
///      stable identifier for that human, used by callers to enforce one-action-per-human.
interface IHumanVerifier {
    /// @param subject The address that performs the gated action (e.g. claims a reward).
    /// @param proof   Opaque proof bytes (a Self proof in production).
    /// @return nullifier A per-human identifier scoped to this app; equal across all of a
    ///         single human's wallets, so callers can block Sybil multi-wallet claims.
    function verify(address subject, bytes calldata proof) external returns (uint256 nullifier);
}
