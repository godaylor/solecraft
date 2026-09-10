import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function inlineEntryCss(): Plugin {
  return {
    name: 'solecraft-inline-entry-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlAsset = bundle['index.html']

      if (!htmlAsset || htmlAsset.type !== 'asset') return

      let html = String(htmlAsset.source)
      const stylesheetPattern =
        /<link rel="stylesheet" crossorigin href="\/(assets\/[^"?]+\.css)">/g

      html = html.replace(stylesheetPattern, (link, fileName: string) => {
        const cssAsset = bundle[fileName]

        if (!cssAsset || cssAsset.type !== 'asset') return String(link)

        return `<style data-solecraft-entry-css>${String(cssAsset.source)}</style>`
      })

      htmlAsset.source = html
    },
  }
}

export default defineConfig({
  plugins: [react(), inlineEntryCss()],
  server: { host: '127.0.0.1', port: 32600, strictPort: true },
  preview: { host: '127.0.0.1', port: 32601, strictPort: true },
  build: {
    manifest: true,
  },
})
