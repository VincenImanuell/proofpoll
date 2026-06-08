import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ["react", "react-dom", "viem", "@proofpoll/sdk"],
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".cjs" : ".js" }),
});
