// Builds PunchLab as one self-contained HTML body for a Claude Artifact preview:
// JS and CSS inlined, no service worker, in-memory routing (the artifact frame
// allows neither URL paths nor service workers). Output: dist-artifact/punchlab-artifact.html
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const root = process.cwd()
const outDir = join(root, 'dist-artifact')
const outFile = join(outDir, 'punchlab-artifact.html')
const require = createRequire(join(root, 'package.json'))
const { build } = await import(require.resolve('vite'))
const react = (await import(require.resolve('@vitejs/plugin-react'))).default
const tailwind = (await import(require.resolve('@tailwindcss/vite'))).default
process.env.VITE_ROUTER = 'memory'
await build({ root, configFile: false, base: './', logLevel: 'warn', plugins: [react(), tailwind()],
  build: { outDir, emptyOutDir: true, assetsInlineLimit: 100_000_000, modulePreload: false, rolldownOptions: { output: { codeSplitting: false } } } })
const assets = join(outDir, 'assets'); const files = readdirSync(assets)
const css = files.filter(f => f.endsWith('.css')).map(f => readFileSync(join(assets, f), 'utf8')).join('\n')
const js = files.filter(f => f.endsWith('.js')).map(f => readFileSync(join(assets, f), 'utf8'))
if (js.length !== 1) throw new Error('expected one JS chunk, got ' + js.length)
const safeJs = js[0].replace(/<\/script/gi, '<\\/script')
const html = `<title>PunchLab</title>
<meta name="theme-color" content="#0f1115">
<style>${css}</style>
<div id="root"></div>
<script type="module">${safeJs}</script>
`
writeFileSync(outFile, html)
console.log('wrote', outFile, (html.length / 1024).toFixed(0) + ' KB')
