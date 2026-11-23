/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'memory' for embedded previews, 'hash' for static hosts like GitHub Pages; default 'browser'. */
  readonly VITE_ROUTER?: 'memory' | 'hash' | 'browser'
}
