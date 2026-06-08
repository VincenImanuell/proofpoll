/// @proofpoll/sdk — collect verified-human survey responses with instant cUSD rewards on Celo.

export { rewardEscrowAbi, selfHumanVerifierAbi } from "./abi/index.js";
export { celoSepolia, KNOWN_ADDRESSES, type KnownNetwork } from "./chains.js";
export {
  canonicalize,
  hashJson,
  hashSchema,
  hashResponse,
  type ResponseCommitmentInput,
} from "./hashing.js";
export {
  generateAnswerKey,
  exportKey,
  importKey,
  encryptAnswer,
  decryptAnswer,
  type EncryptedAnswer,
} from "./crypto.js";
export {
  uploadToLighthouse,
  ipfsUri,
  ipfsGatewayUrl,
  type UploadOptions,
  type UploadResult,
} from "./storage.js";
export {
  encodeCreateSurvey,
  encodeSubmitResponse,
  encodeCloseSurvey,
  type CreateSurveyArgs,
  type SubmitResponseArgs,
} from "./calldata.js";
export { createProofPollClient, type ProofPollClient, type ProofPollClientConfig } from "./client.js";
export { prepareResponse, type PrepareResponseInput, type PreparedResponse } from "./response.js";
export type { Survey, SurveySchema, SurveyQuestion, ConsentRecord } from "./types.js";
