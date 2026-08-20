// The X decode holds ~109 complete bey assemblies, each in its own folder with
// the FBX nested one level down beside its AO/EdgeMask maps and chip decal.
// Only a couple of dozen were catalogued. This copies the rest in and writes
// catalogue rows for them.
//
//   node scripts/add-x-beys.mjs           # preview
//   node scripts/add-x-beys.mjs --write
import fs from 'fs'
import path from 'path'

const SRC = 'D:/beyblade/reference/decoded/beybladex/models/beyblades'
const DST = path.resolve('public/assets/models')
const CATALOG = path.resolve('src/lib/assets.ts')
const write = process.argv.includes('--write')

/** `529268 - F9324 - SOAR PHOENIX 9-60GF` -> `Soar Phoenix 9-60GF` */
function pretty(folder) {
  let s = folder
    .replace(/_Prefab$/i, '')
    .replace(/-Blade_UI$/i, '')
    .replace(/^\d{6}\s*-?\s*/, '')
    .replace(/^[A-Z]\d{4}\s*-?\s*/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Split a run-together name like `SwordDran3-60F`.
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Za-z])(\d-\d)/g, '$1 $2')
  return s
    .split(' ')
    .map((w) => (/^[\d-]/.test(w) || w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const norm = (s) => s.replace(/[^a-z0-9]/gi, '').toLowerCase()
const slug = (s) => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase()

const catalog = fs.readFileSync(CATALOG, 'utf8')
const existing = new Set([...catalog.matchAll(/name: '([^']+)'/g)].map((m) => norm(m[1])))

const found = []
for (const folder of fs.readdirSync(SRC, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue
  // `-Blade` / `-Ratchet` / `-Bit` folders are single components, not beys.
  if (/-(Blade|Ratchet|Bit)$/i.test(folder.name)) continue
  // AssetStudio nests it: <folder>/FBX_GameObjects/<folder>/<folder>.fbx
  const fbx = path.join(SRC, folder.name, 'FBX_GameObjects', folder.name, `${folder.name}.fbx`)
  if (!fs.existsSync(fbx)) continue

  const name = pretty(folder.name)
  if (!name || existing.has(norm(name))) continue
  existing.add(norm(name))
  found.push({ name, fbx, dir: path.dirname(fbx), file: `x_${slug(name)}.fbx` })
}

const CLASSES = ['Attack', 'Defense', 'Stamina', 'Balance']
const ACCENTS = ['#e11d2e', '#10a5ff', '#ffd21e', '#c6ced8', '#7a5cff', '#00e0a8', '#ff8a2b', '#35d4ff']
const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

let id = 200
const rows = found.map((f) => {
  const h = hash(f.name)
  return (
    `  { id: 'bx-${++id}', name: '${f.name.replace(/'/g, "\\'")}', series: 'X', ` +
    `class: '${CLASSES[h % 4]}', price: ${(1.4 + (h % 220) / 100).toFixed(2)}, ` +
    'image: `${XC}/bg-waiting-01.png`, ' +
    `model: \`\${M}/${f.file}\`, tint: '${ACCENTS[h % 8]}', ` +
    `creator: 'X Archive', edition: '${String((h % 40) + 1).padStart(2, '0')} / ${(h % 120) + 40}', ` +
    `accent: '${ACCENTS[h % 8]}' },`
  )
})

console.log(`new X assemblies: ${found.length}`)
if (!write) {
  console.log(rows.slice(0, 4).join('\n'))
  console.log('\n(run with --write to copy meshes and patch the catalogue)')
  process.exit(0)
}

let copied = 0
for (const f of found) {
  fs.copyFileSync(f.fbx, path.join(DST, f.file))
  copied++
  // The AO / EdgeMask / decal maps sit beside the mesh and resolve by basename.
  for (const png of fs.readdirSync(f.dir).filter((n) => /\.png$/i.test(n))) {
    const target = path.join(DST, png)
    if (!fs.existsSync(target)) {
      fs.copyFileSync(path.join(f.dir, png), target)
      copied++
    }
  }
}

const marker = '\n  // Full recovered Burst line'
const out = catalog.replace(marker, `\n  // Full recovered Beyblade X line — one folder per release in the decode.\n${rows.join('\n')}\n${marker}`)
if (out === catalog) throw new Error('catalogue insertion point not found')
fs.writeFileSync(CATALOG, out)
console.log(`copied ${copied} files, added ${rows.length} listings`)
