import type { SurveySchema } from "@proofpoll/sdk";

// Survey schemas live off-chain (only their hash is committed on-chain). For this demo we persist
// created schemas in localStorage keyed by surveyId so the respondent page can render the questions.
// A production app would fetch the schema from IPFS via the on-chain schemaHash.

const KEY = "proofpoll.schemas";
type Store = Record<string, SurveySchema>;

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

export function saveSchema(surveyId: bigint, schema: SurveySchema): void {
  const store = read();
  store[surveyId.toString()] = schema;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function loadSchema(surveyId: bigint): SurveySchema | undefined {
  return read()[surveyId.toString()];
}

export const DEMO_SCHEMA: SurveySchema = {
  title: "Celo stablecoin sentiment",
  description: "A short demo survey — verified humans only.",
  questions: [
    { id: "weekly", prompt: "Do you use stablecoins at least weekly?", type: "single", options: ["Yes", "No"] },
    { id: "nps", prompt: "How likely are you to recommend MiniPay? (1–5)", type: "scale" },
    { id: "improve", prompt: "What would make you use it more?", type: "text" },
  ],
};
