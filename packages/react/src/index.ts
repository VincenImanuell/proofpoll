/// @proofpoll/react — hooks + widgets for verified-human surveys with instant cUSD rewards on Celo.

export { ProofPollProvider, type ProofPollProviderProps } from "./ProofPollProvider.js";
export { ProofPollContext, type ProofPollContextValue, type GateMode } from "./context.js";
export { celoSepolia, DEFAULT_CHAIN, FALLBACK_CUSD } from "./config.js";
export { mockSelfHubAbi } from "./abi/mockSelfHubAbi.js";
export { sendLegacy, type SendLegacyParams } from "./lib/tx.js";
export { friendlyError, errorNameOf, decodeRevert } from "./lib/errors.js";
export { waitOrThrow } from "./lib/receipt.js";

export { useProofPoll } from "./hooks/useProofPoll.js";
export { useWallet, type UseWalletResult } from "./hooks/useWallet.js";
export { useSurvey, type UseSurveyOptions, type UseSurveyResult } from "./hooks/useSurvey.js";
export { useReward, type UseRewardResult, type SubmitArgs, type WriteStatus } from "./hooks/useReward.js";
export {
  useCreateSurvey,
  type UseCreateSurveyResult,
  type CreateArgs,
  type CreateStatus,
} from "./hooks/useCreateSurvey.js";
export { useCloseSurvey, type UseCloseSurveyResult, type CloseStatus } from "./hooks/useCloseSurvey.js";
export {
  useVerification,
  type UseVerificationResult,
  type VerificationStatus,
  type VerificationError,
} from "./hooks/useVerification.js";
export { useCUSD, type UseCUSDResult } from "./hooks/useCUSD.js";

export { ConnectButton, type ConnectButtonProps } from "./components/ConnectButton.js";
export { VerifiedHumanGate, type VerifiedHumanGateProps } from "./components/VerifiedHumanGate.js";
export { SurveyWidget, type SurveyWidgetProps, type SurveyWidgetSuccess } from "./components/SurveyWidget.js";
export {
  CreateSurveyForm,
  type CreateSurveyFormProps,
  type CreateSurveySuccess,
} from "./components/CreateSurveyForm.js";
export { QuestionInput, type QuestionInputProps } from "./components/QuestionInput.js";
export { TxStatus, type TxStatusProps, type TxPhase } from "./components/TxStatus.js";
export { TxLink, type TxLinkProps } from "./components/TxLink.js";

export type { Survey, SurveySchema, SurveyQuestion, ConsentRecord } from "@proofpoll/sdk";
