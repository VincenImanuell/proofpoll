/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESCROW?: string;
  readonly VITE_VERIFIER?: string;
  readonly VITE_MOCK_HUB?: string;
  readonly VITE_CUSD?: string;
  readonly VITE_LIGHTHOUSE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
