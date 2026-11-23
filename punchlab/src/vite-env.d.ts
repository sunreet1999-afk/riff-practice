/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'memory' for embedded previews that can't use URL routing. */
  readonly VITE_ROUTER?: 'memory' | 'browser'
}
