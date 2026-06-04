// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { IHumanVerifier } from "./interfaces/IHumanVerifier.sol";

/// @title RewardEscrow — Stripe-for-verified-human-surveys
/// @author ProofPoll
/// @notice An organizer escrows a stablecoin reward pool (cUSD on Celo); every unique,
///         Self-verified human who submits a response is paid the reward instantly.
/// @dev Design choices that matter for ProofPoll:
///      - **Non-gambling:** the reward is guaranteed per accepted response, never a lottery
///        or a pot split among entrants. Funds are escrowed up front by the organizer.
///      - **Anti-Sybil:** uniqueness is enforced on the human (Self nullifier), not the
///        wallet, so one person cannot drain a survey from many addresses.
///      - **Consent / data ownership:** each response carries an on-chain integrity
///        commitment (`responseHash`) to the off-chain encrypted answer + consent record.
contract RewardEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Stablecoin paid out as rewards (cUSD on Celo).
    /// @dev camelCase kept intentionally for clean public-getter ergonomics in the SDK/ABI.
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    IERC20 public immutable payToken;

    /// @notice Proof-of-personhood gate (a Self Protocol adapter in production).
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    IHumanVerifier public immutable verifier;

    struct Survey {
        address organizer; //            who funds and owns the survey
        uint96 rewardPerResponse; //     stablecoin paid per accepted response
        uint128 balance; //              remaining escrowed funds
        uint64 maxResponses; //          hard cap on responses (== prefunded slots)
        uint64 responseCount; //         accepted responses so far
        bytes32 schemaHash; //           commitment to the question set + metadata (IPFS)
        bool open; //                    accepting responses?
    }

    /// @notice Auto-incrementing id assigned to the next created survey.
    uint256 public nextSurveyId;

    mapping(uint256 surveyId => Survey) private _surveys;

    /// @notice surveyId => Self nullifier => has this human already responded?
    mapping(uint256 => mapping(uint256 => bool)) public hasResponded;

    event SurveyCreated(
        uint256 indexed surveyId,
        address indexed organizer,
        uint96 rewardPerResponse,
        uint64 maxResponses,
        uint256 funded,
        bytes32 schemaHash
    );
    event ResponseSubmitted(
        uint256 indexed surveyId,
        address indexed respondent,
        uint256 indexed nullifier,
        bytes32 responseHash,
        uint256 reward
    );
    event SurveyClosed(uint256 indexed surveyId, uint256 refunded);

    error ZeroAddress();
    error InvalidParams();
    error PoolTooLarge();
    error NotOrganizer();
    error SurveyNotOpen();
    error SurveyFull();
    error AlreadyResponded();

    constructor(IERC20 payToken_, IHumanVerifier verifier_) {
        if (address(payToken_) == address(0) || address(verifier_) == address(0)) revert ZeroAddress();
        payToken = payToken_;
        verifier = verifier_;
    }

    /// @notice Create and fully fund a survey, pulling `rewardPerResponse * maxResponses`
    ///         stablecoin from the caller (the organizer must `approve` this contract first).
    /// @param rewardPerResponse Stablecoin paid to each accepted respondent.
    /// @param maxResponses      Number of prefunded response slots.
    /// @param schemaHash        Commitment to the off-chain question set + metadata (e.g. IPFS).
    /// @return surveyId         The id of the newly created survey.
    function createSurvey(uint96 rewardPerResponse, uint64 maxResponses, bytes32 schemaHash)
        external
        nonReentrant
        returns (uint256 surveyId)
    {
        if (rewardPerResponse == 0 || maxResponses == 0) revert InvalidParams();
        uint256 total = uint256(rewardPerResponse) * maxResponses;
        if (total > type(uint128).max) revert PoolTooLarge();

        surveyId = nextSurveyId++;
        _surveys[surveyId] = Survey({
            organizer: msg.sender,
            rewardPerResponse: rewardPerResponse,
            // safe: `total` is checked above to fit in uint128.
            // forge-lint: disable-next-line(unsafe-typecast)
            balance: uint128(total),
            maxResponses: maxResponses,
            responseCount: 0,
            schemaHash: schemaHash,
            open: true
        });

        payToken.safeTransferFrom(msg.sender, address(this), total);
        emit SurveyCreated(surveyId, msg.sender, rewardPerResponse, maxResponses, total, schemaHash);
    }

    /// @notice Submit a response as a verified unique human and receive the reward instantly.
    /// @param surveyId     The survey being answered.
    /// @param responseHash Integrity commitment to the off-chain encrypted answer + consent record.
    /// @param proof        Proof-of-personhood proof; the verifier derives the human's nullifier.
    function submitResponse(uint256 surveyId, bytes32 responseHash, bytes calldata proof)
        external
        nonReentrant
    {
        Survey storage s = _surveys[surveyId];
        if (!s.open) revert SurveyNotOpen();
        if (s.responseCount >= s.maxResponses) revert SurveyFull();

        // Establish personhood and derive the human's app-scoped nullifier. Reverts if invalid.
        uint256 nullifier = verifier.verify(msg.sender, proof);
        if (hasResponded[surveyId][nullifier]) revert AlreadyResponded();

        // Effects (checks-effects-interactions; also guarded by nonReentrant).
        hasResponded[surveyId][nullifier] = true;
        uint256 reward = s.rewardPerResponse;
        s.responseCount += 1;
        // safe: `reward` is a uint96 field, always < type(uint128).max.
        // forge-lint: disable-next-line(unsafe-typecast)
        s.balance -= uint128(reward);
        if (s.responseCount == s.maxResponses) s.open = false;

        // Interaction: instant guaranteed payout.
        payToken.safeTransfer(msg.sender, reward);
        emit ResponseSubmitted(surveyId, msg.sender, nullifier, responseHash, reward);
    }

    /// @notice Organizer closes a survey early and reclaims any unspent escrow.
    function closeSurvey(uint256 surveyId) external nonReentrant {
        Survey storage s = _surveys[surveyId];
        if (msg.sender != s.organizer) revert NotOrganizer();
        if (!s.open) revert SurveyNotOpen();

        s.open = false;
        uint256 refund = s.balance;
        s.balance = 0;
        if (refund > 0) payToken.safeTransfer(s.organizer, refund);
        emit SurveyClosed(surveyId, refund);
    }

    /// @notice Full survey record.
    function getSurvey(uint256 surveyId) external view returns (Survey memory) {
        return _surveys[surveyId];
    }

    /// @notice Number of response slots still available.
    function remainingSlots(uint256 surveyId) external view returns (uint256) {
        Survey storage s = _surveys[surveyId];
        return s.maxResponses - s.responseCount;
    }
}
