// Separates real energy layers from the disks and drivers that share the
// `*geo.fbx` naming, so only complete beys get catalogued.
//
//   node scripts/find-new-beys.mjs [--copy]
import fs from 'fs'
import path from 'path'

const PUB = path.resolve('public/assets/models')
const DEC = 'D:/beyblade/reference/decoded'
const copy = process.argv.includes('--copy')

const src = fs.readFileSync('src/lib/assets.ts', 'utf8')
const listed = new Set([...src.matchAll(/model: `\$\{M\}\/([^`]+)`/g)].map((m) => m[1].toLowerCase()))

const files = new Map()
;(function walk(dir) {
  let entries = []
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (!files.has(e.name.toLowerCase())) files.set(e.name.toLowerCase(), p)
  }
})(DEC)

// Burst driver names. `<driver>sgeo.fbx` is the driver, not a bey.
const DRIVERS = ['accel','destroy','eternal','jaggy','hunter','liner','atomic','xtreme','quick','zephyr','orbit','revolve','nothing','trans','volcanic','blow','massive','press','unite','variable','yard','bump','charge','gravity','kick','impact','illegal','ultimate','reboot','wedge','guard','defense','around','claw','friction','glaive','high','keep','merge','moment','operate','proof','ring','rise','sting','vortex','wave','dimension','evolution','fusion','generate','hold','loop','metal','needle','octa','power','quake','retsu','spiral','sword','tapered','tower','zeta','absorb','bearing','cycle','drift','edge','flugel','gyro','jerk','level','mobius','nexus','pierce','quattro','rush','shot','trick','under']
const isDriver = (n) => new RegExp(`^(${DRIVERS.join('|')})s?geo`, 'i').test(n)
// Burst disks are numbered (0, 00, 1..13) sometimes with a letter suffix.
const isDisk = (n) => /^\d+[a-z]?geo/i.test(n) || /^(disk|disc|forge)/i.test(n)
const isFx = (n) => /^(fx_|v_|vfx|fireball|geo\.fbx$)/i.test(n)
const isArena = (n) => /arena|stadium|floor/i.test(n)
const isPart = (n) => /_(layer|dis[kc]|tip)\.obj$/i.test(n)

/** `diomedesd4geo.fbx` -> `Diomedes D4` */
function nameOf(file) {
  let s = file.replace(/\.(fbx|obj)$/i, '').replace(/geo(_?v\d+)?$/i, '')
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim()
  s = s.replace(/\b([a-z])(\d)\b/gi, (_, a, d) => `${a.toUpperCase()}${d}`)
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, ' ')
}

/*
 * The only unambiguous signal for an energy layer is a beast name followed by
 * its layer code — Diomedes D4, Air Knight K5, Achilles A8. Everything else in
 * this pool shares the `*geo.fbx` suffix: `0DaggerGeo` is a disk plus driver,
 * `SurviveSGeo` and `AmbushGeo` are drivers, `10ExpandGeo` is a disk combo.
 */
const LAYER_CODE = /^([a-z][a-z'-]{3,})([a-z])(\d)(premium|turbo|prime|black|red|gold)?geo(_?v\d+)?\.fbx$/i

const seen = new Set()
const candidates = []
for (const [lower, full] of files) {
  const m = lower.match(LAYER_CODE)
  if (!m) continue
  if (listed.has(lower) || isFx(lower) || isDriver(lower) || isDisk(lower) || isArena(lower) || isPart(lower)) continue
  // Collapse V2/V3 re-exports of the same release to one entry.
  const key = `${m[1]}${m[2]}${m[3]}${m[4] ?? ''}`
  if (seen.has(key)) continue
  seen.add(key)
  candidates.push({ file: path.basename(full), lower, src: full, name: nameOf(path.basename(full)) })
}
candidates.sort((a, b) => a.name.localeCompare(b.name))

console.log(`decoded files: ${files.size}`)
console.log(`uncatalogued complete-bey candidates: ${candidates.length}`)
console.log(candidates.slice(0, 50).map((c) => `  ${c.file.padEnd(42)} ${c.name}`).join('\n'))

if (copy) {
  let meshes = 0
  let maps = 0
  for (const c of candidates) {
    fs.copyFileSync(c.src, path.join(PUB, c.file))
    meshes++
    // Only the maps this mesh actually references — the export folders hold
    // thousands of shared PNGs and a blanket copy would drag them all in.
    const txt = fs.readFileSync(c.src, 'latin1')
    const refs = new Set([...txt.matchAll(/[A-Za-z0-9_\-#.]+\.(?:png|jpg|tga)/g)].map((m) => m[0]))
    const dir = path.dirname(c.src)
    for (const ref of refs) {
      const from = path.join(dir, ref)
      const to = path.join(PUB, path.basename(ref))
      if (fs.existsSync(from) && !fs.existsSync(to)) {
        fs.copyFileSync(from, to)
        maps++
      }
    }
  }
  console.log(`copied ${meshes} meshes + ${maps} maps`)
}
fs.writeFileSync('_new-beys.json', JSON.stringify(candidates.map(({ file, name }) => ({ file, name })), null, 1))
