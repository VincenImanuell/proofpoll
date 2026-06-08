// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SelfTypes } from "./SelfTypes.sol";

/// @title SelfVerificationRootStub
/// @notice In-tree mirror of the `SelfVerificationRoot` base contract from the official Self
///         contracts package, exposing the same integration surface a child contract overrides —
///         so ProofPoll's adapter is written exactly as it would be against the real package.
/// @dev On a real network the official `SelfVerificationRoot` is constructed with the Identity
///      Verification Hub address; the Hub performs ZK proof verification off your contract and then
///      calls back into `onVerificationSuccess`, which decodes the disclosure and dispatches to
///      `customVerificationHook`. This stub reproduces that exact callback flow so the adapter +
///      tests + escrow integration are real; the only thing swapped at production time is the base.
///
///      Differences from the official base (documented honestly, not hidden):
///        - `scope` here is a `keccak256` of (address, seed). The real base derives it via a
///          Poseidon hash of the chunked contract address; the value differs but the *role*
///          (replay/cross-contract protection, app-scoped nullifiers) is identical.
///        - Real ZK verification happens in the Hub. This stub trusts the configured `hub` to only
///          call back on a genuine proof — which is exactly the trust model of the real base, where
///          `onVerificationSuccess` is also gated to the Hub address.
abstract contract SelfVerificationRootStub {
    /// @notice The Identity Verification Hub allowed to deliver verification results.
    /// @dev On testnet this is a `MockSelfHub`; on mainnet it is Self's deployed Hub V2.
    /// @dev camelCase kept intentionally to mirror the official base's public getter (`hub()`).
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    address public immutable hub;

    /// @notice App-scoped value binding proofs (and thus nullifiers) to this contract.
    /// @dev camelCase kept intentionally to mirror the official base's public getter (`scope()`).
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    uint256 public immutable scope;

    error OnlyHub();

    constructor(address hub_, string memory scopeSeed) {
        if (hub_ == address(0)) revert OnlyHub();
        hub = hub_;
        scope = uint256(keccak256(abi.encodePacked(address(this), scopeSeed)));
    }

    /// @notice Hub callback delivering a verified disclosure. Only the Hub may call it.
    /// @param output   ABI-encoded `SelfTypes.GenericDiscloseOutputV2`.
    /// @param userData Opaque app data echoed back from the proof request.
    function onVerificationSuccess(bytes calldata output, bytes calldata userData) external {
        if (msg.sender != hub) revert OnlyHub();
        SelfTypes.GenericDiscloseOutputV2 memory disclose =
            abi.decode(output, (SelfTypes.GenericDiscloseOutputV2));
        customVerificationHook(disclose, userData);
    }

    /// @notice Which verification config the Hub should enforce for a request.
    /// @dev Mirrors the official `getConfigId`; ProofPoll returns a single static config.
    function getConfigId(bytes32, bytes32, bytes memory) public view virtual returns (bytes32) {
        return bytes32(0);
    }

    /// @notice Override to consume a successful, verified disclosure.
    function customVerificationHook(SelfTypes.GenericDiscloseOutputV2 memory output, bytes memory userData)
        internal
        virtual;
}
