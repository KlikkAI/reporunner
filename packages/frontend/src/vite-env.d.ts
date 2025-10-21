/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Markdown file imports
declare module '*.md' {
  const content: string;
  export default content;
}

// Raw markdown imports (with ?raw suffix)
declare module '*.md?raw' {
  const content: string;
  export default content;
}
