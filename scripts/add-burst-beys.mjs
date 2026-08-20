// The export ships 229 Burst energy layers; only a handful were catalogued.
// This copies every layer that has a real colour map (plus that map) into
// public/assets/models and emits catalogue rows for them, so the roster is the
// whole recovered line rather than the slice an earlier pass happened to pick.
//
//   node scripts/add-burst-beys.mjs        # preview
//   node scripts/add-burst-beys.mjs --write
import fs from 'fs'
import path from 'path'

const MESH = 'D:/beyblade/reference/decoded/beybladeburst/export/Mesh'
const ROOT = 'D:/beyblade/reference/decoded/beybladeburst'
const DST = path.resolve('public/assets/models')
const CATALOG = path.resolve('src/lib/assets.ts')
const write = process.argv.includes('--write')

const tex = new Map()
;(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.png$/i.test(e.name) && !tex.has(e.name)) tex.set(e.name, p)
  }
})(ROOT)

const catalog = fs.readFileSync(CATALOG, 'utf8')
const layers = fs
  .readdirSync(MESH)
  .filter((f) => /_Layer\.obj$/i.test(f) && !/_#\d/.test(f))
  .map((file) => {
    const base = file.replace(/\.obj$/i, '')
    const texture = [`${base}_Color.png`, `${base}.png`].find((c) => tex.has(c))
    return { file, base, texture }
  })
  .filter((l) => l.texture && !catalog.includes(l.file))

/** `AbyssFafnirF6_Layer` -> `Abyss Fafnir F6` */
const pretty = (base) =>
  base
    .replace(/_Layer$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

const CLASSES = ['Attack', 'Defense', 'Stamina', 'Balance']
const ACCENTS = ['#e11d2e', '#10a5ff', '#ffd21e', '#c6ced8', '#7a5cff', '#00e0a8', '#ff8a2b', '#35d4ff']
const CREATORS = ['Burst Vault', 'WBBA Works', 'Beylocker', 'Rare Bey Club']
const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

let id = 400
const rows = layers.map((l) => {
  const h = hash(l.base)
  const n = ++id
  return (
    `  { id: 'bb-${n}', name: '${pretty(l.base).replace(/'/g, "\\'")}', series: 'Burst', ` +
    `class: '${CLASSES[h % 4]}', price: ${(1.2 + (h % 180) / 100).toFixed(2)}, ` +
    'image: `${BC}/battle_menu_quick_battle_imagery.png`, ' +
    `model: \`\${M}/${l.file}\`, texture: \`\${M}/${l.texture}\`, ` +
    `creator: '${CREATORS[h % 4]}', edition: '${String((h % 40) + 1).padStart(2, '0')} / ${(h % 120) + 40}', ` +
    `accent: '${ACCENTS[h % 8]}' },`
  )
})

console.log(`addable layers: ${layers.length}`)
if (!write) {
  console.log(rows.slice(0, 3).join('\n'))
  console.log('\n(run with --write to copy meshes and patch the catalogue)')
  process.exit(0)
}

let copied = 0
for (const l of layers) {
  fs.copyFileSync(path.join(MESH, l.file), path.join(DST, l.file))
  fs.copyFileSync(tex.get(l.texture), path.join(DST, l.texture))
  copied += 2
}

const marker = '\n  // Remaining recovered meshes that had no listing.'
const out = catalog.replace(marker, `\n  // Full recovered Burst line — layer + disc + driver assembled at load.\n${rows.join('\n')}\n${marker}`)
if (out === catalog) throw new Error('catalogue insertion point not found')
fs.writeFileSync(CATALOG, out)
console.log(`copied ${copied} files, added ${rows.length} listings`)
