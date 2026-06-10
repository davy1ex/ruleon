/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYNC_ENDPOINT?: string;
  readonly VITE_E2E?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.sql?raw" {
  const content: string;
  export default content;
}
