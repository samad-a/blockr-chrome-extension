// Zips dist/ for upload to the Chrome Web Store: release/blockr-<version>.zip
// Run via `npm run package` (builds first). Uses forward-slash entry names and
// puts manifest.json at the zip root, which the store requires.
import AdmZip from 'adm-zip'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

const manifestPath = 'dist/manifest.json'
if (!existsSync(manifestPath)) {
  console.error('dist/manifest.json not found. Run `npm run build` first.')
  process.exit(1)
}

const { version } = JSON.parse(readFileSync(manifestPath, 'utf8'))
mkdirSync('release', { recursive: true })
const out = `release/blockr-${version}.zip`

const zip = new AdmZip()
zip.addLocalFolder('dist')
zip.writeZip(out)
console.log(`Created ${out} (${zip.getEntries().length} files)`)
