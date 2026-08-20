// Emits catalogue rows for the layers `find-new-beys.mjs` turned up, then
// splices them into assets.ts before the closing bracket.
//
//   node scripts/add-new-beys.mjs
import fs from 'fs'
import path from 'path'

const ASSETS = path.resolve('src/lib/assets.ts')
const PUB = path.resolve('public/assets/models')
const beys = JSON.parse(fs.readFileSync('_new-beys.json', 'utf8'))

const src = fs.readFileSync(ASSETS, 'utf8')
const listed = new Set([...src.matchAll(/model: `\$\{M\}\/([^`]+)`/g)].map((m) => m[1].toLowerCase()))
const maxId = Math.max(...[...src.matchAll(/id: 'bb-(\d+)'/g)].map((m) => +m[1]))

// Class follows the layer letter where the line is consistent about it.
const CLASS_BY_HINT = [
  [/fafnir|wyvern|spriggan|forneus|kerbeus|balkesh|gaianon|gianon/i, 'Stamina'],
  [/kraken|guard|shield|hades|engaard|betromoth|balor|gargoyle/i, 'Defense'],
  [/valkyrie|valtryek|achilles|helios|hyperion|dragon|belfyre|doomscizor|knight/i, 'Attack'],
]
const classOf = (n) => CLASS_BY_HINT.find(([re]) => re.test(n))?.[1] ?? 'Balance'

const ACCENTS = ['#e11d2e', '#10a5ff', '#ffd21e', '#c6ced8', '#8b5cf6', '#22c55e', '#f97316', '#06b6d4']
const CREATORS = ['Burst Vault', 'WBBA Works', 'Rare Bey Club', 'Beylocker']

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
const texFor = (file) => {
  const base = file.replace(/geo(_?v\d+)?\.fbx$/i, '')
  for (const cand of fs.readdirSync(PUB)) {
    if (!/_color\.png$/i.test(cand)) continue
    const k = cand.replace(/[^a-z0-9]/gi, '').toLowerCase()
    if (k.startsWith(base.replace(/[^a-z0-9]/gi, '').toLowerCase())) return cand
  }
  return undefined
}

const rows = []
let id = maxId
for (const b of beys) {
  if (listed.has(b.file.toLowerCase())) continue
  if (!fs.existsSync(path.join(PUB, b.file))) continue
  id++
  const h = hash(b.file)
  const name = b.name.replace(/([a-z])([A-Z])/g, '$1 $2')
  const tex = texFor(b.file)
  rows.push(
    `  { id: 'bb-${id}', name: '${name.replace(/'/g, "\\'")}', series: 'Burst', class: '${classOf(b.file)}', ` +
      `price: ${(1.4 + (h % 160) / 100).toFixed(2)}, image: \`\${BC}/battle_menu_quick_battle_imagery.png\`, ` +
      `model: \`\${M}/${b.file}\`, ${tex ? `texture: \`\${M}/${tex}\`, ` : ''}` +
      `creator: '${CREATORS[h % CREATORS.length]}', edition: '${String((h % 40) + 1).padStart(2, '0')} / ${100 + (h % 90)}', ` +
      `accent: '${ACCENTS[h % ACCENTS.length]}' },`,
  )
}

if (!rows.length) {
  console.log('nothing new to add')
  process.exit(0)
}

// Splice in at the close of the marketplaceListings array — the second bare
// `]` in the file, the first being the `modelFiles` manifest.
// trim(): the file is CRLF, so a bare `]` line reads as `]\r`.
const lines = src.split('\n')
const closes = lines.map((l, i) => (l.trim() === ']' ? i : -1)).filter((i) => i >= 0)
if (closes.length < 1) throw new Error('listings array close not found in assets.ts')
const at = closes[0]
lines.splice(at, 0, '', '  // Layers recovered in the full catalogue sweep.', ...rows)
const out = lines.join('\n')
fs.writeFileSync(ASSETS, out)
console.log(`added ${rows.length} listings (bb-${maxId + 1} … bb-${id})`)
console.log(`with texture: ${rows.filter((r) => r.includes('texture:')).length}`)
