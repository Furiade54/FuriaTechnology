/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPERADMIN_KEY: string
  readonly VITE_WHATSAPP_NUMBER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
