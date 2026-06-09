// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IHumanVerifier } from "./interfaces/IHumanVerifier.sol";
import { SelfTypes } from "./self/SelfTypes.sol";
import { SelfVerificationRootStub } from "./self/SelfVerificationRootStub.sol";

/// @title SelfHumanVerifier — Self Protocol adapter for ProofPoll
/// @author ProofPoll
/// @notice Bridges Self Protocol proof-of-personhood to ProofPoll's `IHumanVerifier`, so
///         `RewardEscrow` can enforce *one real human, one response* without knowing anything
///         about Self internals.
/// @dev Flow:
///      1. A respondent completes the Self flow in the app (QR / mobile). The Identity
///         Verification Hub verifies the ZK proof and calls `onVerificationSuccess` here, which
///         dispatches to `customVerificationHook` and records `subject → nullifier`.
///      2. Later, `RewardEscrow.submitResponse` calls `verify(subject, "")`, a cheap on-chain
///         lookup returning the human's app-scoped nullifier (reverting if the wallet has not
///         been verified). The escrow uses the nullifier to block repeat humans across wallets.
///
///      Registering verification (step 1) and claiming a reward (step 2) are deliberately
///      decoupled: this matches how Self actually delivers results (async Hub callback) and lets
///      one verification gate many surveys.
contract SelfHumanVerifier is SelfVerificationRootStub, IHumanVerifier {
    /// @notice Verified wallet => the human's app-scoped Self nullifier.
    mapping(address subject => uint256 nullifier) public nullifierOf;

    /// @notice Has this wallet completed Self verification? (Distinguishes a real 0 nullifier.)
    mapping(address subject => bool verified) public isHuman;

    /// @notice Emitted when a wallet is bound to a verified human.
    event HumanVerified(address indexed subject, uint256 indexed nullifier);

    /// @notice Verification config the real Self Hub should enforce. Zero on testnet (the MockSelfHub
    ///         ignores it). On mainnet this MUST be set to a config registered via the Hub's
    ///         `setVerificationConfigV2(...)` — a zero id is not a registered config and would enforce
    ///         no policy on the real Hub. Wiring this is tracked for the mainnet swap (issue #12).
    bytes32 public verificationConfigId;

    error NotVerified();

    /// @param hub_      Identity Verification Hub (a `MockSelfHub` on testnet; Self's Hub V2 on mainnet).
    /// @param scopeSeed Short app scope seed, e.g. "proofpoll".
    constructor(address hub_, string memory scopeSeed) SelfVerificationRootStub(hub_, scopeSeed) { }

    /// @inheritdoc SelfVerificationRootStub
    function getConfigId(bytes32, bytes32, bytes memory) public view override returns (bytes32) {
        return verificationConfigId;
    }

    /// @inheritdoc SelfVerificationRootStub
    /// @dev Binds the verifying wallet to the disclosed nullifier. Idempotent: a human may
    ///      re-verify (e.g. a new wallet) — each wallet maps to the same nullifier, which is what
    ///      makes Sybil resistance hold across a single human's many addresses.
    function customVerificationHook(SelfTypes.GenericDiscloseOutputV2 memory output, bytes memory)
        internal
        override
    {
        address subject = address(uint160(output.userIdentifier));
        nullifierOf[subject] = output.nullifier;
        isHuman[subject] = true;
        emit HumanVerified(subject, output.nullifier);
    }

    /// @inheritdoc IHumanVerifier
    /// @dev `proof` is unused: personhood was established out-of-band via the Self Hub callback.
    ///      A pure on-chain lookup keeps `submitResponse` cheap and avoids re-verifying per survey.
    function verify(address subject, bytes calldata) external view returns (uint256) {
        if (!isHuman[subject]) revert NotVerified();
        return nullifierOf[subject];
    }
}
