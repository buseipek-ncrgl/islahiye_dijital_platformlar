/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EGITIM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

