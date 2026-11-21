import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { getIconData } from '@iconify/utils'
import ionCollection from '@iconify-json/ion/icons.json' with { type: 'json' }

/**
 * The dealer website (the Laravel dealer-lion-client-templates / dealerlion_sales_template sites) as a Vue 3 + Vite
 * single-page app. It builds to static files (`dist/`), served like the monolith frontend. Each dealer's settings come
 * from `config.json` next to index.html (docs/adr/ADR-0002).
 */

// Resolved from the working directory, as unplugin-auto-import resolves its `dirs`: on Windows the drive letter's case
// then matches (c:\ vs C:\), so a module imported both ways (`~/composables/x` and auto-imported) loads once, not twice.
const APP_DIR = resolve('app')

/** Every .vue / .ts file under app/. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) sourceFiles(path, out)
    else if (/\.(vue|ts)$/.test(name)) out.push(path)
  }
  return out
}

/**
 * `virtual:ion-icons`: the Ionicons the app uses (`ion:name` anywhere in app/), as `{ name: { body, width, height } }`.
 * Only those are bundled, and `<Icon name="ion:…">` draws them as inline SVG at once (no icon request, no pop-in).
 */
function ionIcons(): Plugin {
  const id = 'virtual:ion-icons'
  const resolved = '\0' + id
  return {
    name: 'dealer-lion-ion-icons',
    resolveId: (source) => (source === id ? resolved : null),
    load(source) {
      if (source !== resolved) return null
      const names = new Set<string>()
      for (const file of sourceFiles(APP_DIR)) {
        for (const m of readFileSync(file, 'utf8').matchAll(/ion:([a-z0-9-]+)/g)) names.add(m[1]!)
      }
      const icons: Record<string, { body: string; width: number; height: number }> = {}
      for (const name of names) {
        const data = getIconData(ionCollection as any, name)
        if (data) icons[name] = { body: data.body, width: data.width ?? 512, height: data.height ?? 512 }
      }
      return `export default ${JSON.stringify(icons)}`
    },
    handleHotUpdate({ file, server }) {
      // A new icon name in a file: rebuild the icon set.
      if (file.startsWith(APP_DIR.replace(/\\/g, '/')) || file.startsWith(APP_DIR)) {
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    ionIcons(),
    // The auto-imports the Nuxt project had: Vue, the router, the head, the composables and helpers, and the
    // browser runtime of the site's API routes (app/site-api).
    AutoImport({
      imports: ['vue', 'vue-router', { '@unhead/vue': ['useHead', 'useSeoMeta'] }],
      dirs: ['app/composables', 'app/utils', 'app/shims', 'app/site-api/utils', 'app/site-api/runtime'],
      dts: 'auto-imports.d.ts',
      vueTemplate: true,
    }),
    // Components by folder, as in Nuxt: components/template-1/Nav.vue is <Template1Nav />.
    Components({
      dirs: ['app/components'],
      extensions: ['vue'],
      directoryAsNamespace: true,
      collapseSamePrefixes: true,
      dts: 'components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '~': APP_DIR,
      '@': APP_DIR,
    },
  },
  // Nuxt's build flags: this app only ever runs in the browser.
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
    'import.meta.dev': 'import.meta.env.DEV',
  },
  server: { port: 3002 },
  preview: { port: 3002 },
  build: { outDir: 'dist', emptyOutDir: true },
})
