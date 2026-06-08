// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title SelfTypes
/// @notice Local mirror of the Self Protocol V2 disclosure output, kept in-tree so ProofPoll
///         can build, test, and deploy on a testnet without vendoring the full official Self
///         contracts dependency tree (the `selfxyz/contracts` npm package).
/// @dev These field names + ordering mirror `ISelfVerificationRoot.GenericDiscloseOutputV2`
///      from the official Self contracts package (self.xyz). When wiring the real Identity
///      Verification Hub (Celo Sepolia `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`, mainnet
///      `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`), swap this mirror for the official
///      `ISelfVerificationRoot` import. The struct layout is intentionally identical so the
///      swap is a drop-in.
library SelfTypes {
    /// @notice What a successful Self proof discloses back to the consuming contract.
    /// @dev The two fields ProofPoll relies on:
    ///      - `nullifier`: per-human, per-app value → Sybil resistance (one human, one claim).
    ///      - `userIdentifier`: the address the human is verifying for; cast via
    ///        `address(uint160(userIdentifier))`.
    struct GenericDiscloseOutputV2 {
        bytes32 attestationId; //               1=Passport, 2=EU ID, 3=Aadhaar, 4=KYC
        uint256 userIdentifier; //              address(uint160(userIdentifier)) == the verifying wallet
        uint256 nullifier; //                   unique per human per app scope — the anti-Sybil key
        uint256[4] forbiddenCountriesListPacked;
        string issuingState;
        string[] name;
        string idNumber;
        string nationality;
        string dateOfBirth;
        string gender;
        string expiryDate;
        uint256 olderThan;
        bool[3] ofac; //                        [0]=passport#, [1]=name+DOB, [2]=name+YOB
    }
}
