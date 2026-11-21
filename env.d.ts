/// <reference types="vite/client" />

/** The Ionicons the app uses, made by vite.config.ts at build time: `{ name: { body, width, height } }`. */
declare module 'virtual:ion-icons' {
  const icons: Record<string, { body: string; width: number; height: number }>
  export default icons
}

/** Nuxt's build flags, still used in the components; vite.config.ts defines them (always the browser). */
interface ImportMeta {
  readonly client: boolean
  readonly server: boolean
  readonly dev: boolean
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}
