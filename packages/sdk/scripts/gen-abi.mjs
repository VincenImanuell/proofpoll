// Regenerate src/abi/*.ts from the Foundry build artifacts in ../../contracts/out.
// Usage: (cd contracts && forge build) && pnpm --filter @proofpoll/sdk gen:abi
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "src", "abi");
const artifactsDir = join(here, "..", "..", "..", "contracts", "out");

const header =
  "// Auto-generated from Foundry build artifacts (contracts/out). Do not edit by hand.\n" +
  "// Regenerate: pnpm --filter @proofpoll/sdk gen:abi\n\n";

const targets = [
  { contract: "RewardEscrow", varName: "rewardEscrowAbi" },
  { contract: "SelfHumanVerifier", varName: "selfHumanVerifierAbi" },
];

for (const { contract, varName } of targets) {
  const path = join(artifactsDir, `${contract}.sol`, `${contract}.json`);
  if (!existsSync(path)) {
    console.error(`MISSING artifact: ${path} — run \`forge build\` in contracts/ first.`);
    process.exit(1);
  }
  const { abi } = JSON.parse(readFileSync(path, "utf8"));
  const body = `export const ${varName} = ${JSON.stringify(abi, null, 2)} as const;\n`;
  writeFileSync(join(outDir, `${varName}.ts`), header + body);
  console.log(`wrote src/abi/${varName}.ts (${abi.length} entries)`);
}
