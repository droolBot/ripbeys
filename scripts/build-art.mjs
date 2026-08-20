// Indexes the hand-drawn art recovered from the games — the beast chip badges
// and the painted stadium floors — so the site can use real artwork instead of
// CSS shapes.
//
//   node scripts/build-art.mjs
import fs from 'fs'
import path from 'path'

const PUB = path.resolve('public/assets/game')
const OUT = path.resolve('src/data/art.json')

const read = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)) : [])

/**
 * Two naming schemes ship in the decode:
 *   X:     `BX17_DranSword_3-60f.png`     -> `Dran Sword`
 *   Burst: `spirit_thumb_drainFafnir.png` -> `drain Fafnir`
 */
function beastOf(file) {
  const base = file.replace(/\.png$/i, '')
  const burst = base.match(/^spirit_thumb_(.+)$/i)
  if (burst) return burst[1].replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  const x = base.match(/^[A-Z0-9-]+_([A-Za-z]+)/)
  return x ? x[1].replace(/([a-z])([A-Z])/g, '$1 $2') : ''
}

/** Not beast art: a launcher logo, and one badge that decodes near-greyscale. */
const SKIP = /^(BX34_StringLauncherL|UX12_GhostCircle)/i

/** `spirit_thumb_aceDragon.png` -> `Ace Dragon` */
const spiritName = (f) =>
  f
    .replace(/^spirit_thumb_/, '')
    .replace(/\.png$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * `spirit_thumb_base` and `spirit_thumb_base_inner` are the empty hex frame the
 * beasts are composited into, not beasts — sampled at 0% opaque, 0% saturated.
 * Left in, they showed up on the landing marquee as blank hexagons.
 */
const NOT_A_BEAST = /^spirit_thumb_base(_inner)?\./i

const spirits = read(path.join(PUB, 'spirits'))
  .filter((f) => /^spirit_thumb_/.test(f) && !NOT_A_BEAST.test(f))
  .map((file) => ({ file, beast: spiritName(file) }))

const badges = read(path.join(PUB, 'badges'))
  .filter((f) => !SKIP.test(f))
  .map((file) => ({ file, beast: beastOf(file) }))
  .filter((b) => b.beast)
  // One badge per beast keeps the wall varied rather than six Drans in a row.
  .filter((b, i, all) => all.findIndex((o) => o.beast === b.beast) === i)

const floors = read(path.join(PUB, 'floors'))

/**
 * Beast word -> badge file. The art is named in the Japanese order
 * (`Dran Dagger`) while releases are listed in the English one
 * (`Dagger Dran`), so indexing whole names matches almost nothing. Indexing
 * each significant word lets a listing find its own chip either way round.
 */
/** Spellings the games disagree on; both forms point at the same art. */
const ALIASES = {
  achiles: ['achilles'],
  valtryek: ['valkyrie'],
  spryzen: ['spriggan'],
  drainfafnir: ['fafnir'],
  bazilisk: ['basilisk'],
  doomscizor: ['deathscyther'],
  roktavor: ['roktavour'],
}

const byBeast = { x: {}, burst: {} }
for (const b of badges) {
  // Kept apart by series: `Wizard Fafnir` is a Burst bey and must not match the
  // X badge for `Wizard Arrow` just because both start with the same word.
  const bucket = /^spirit_thumb_/i.test(b.file) ? byBeast.burst : byBeast.x
  for (const word of b.beast.split(/\s+/)) {
    const key = word.replace(/[^a-z]/gi, '').toLowerCase()
    if (key.length < 4) continue
    for (const k of [key, ...(ALIASES[key] ?? [])]) if (!bucket[k]) bucket[k] = b.file
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify({ badges, floors, byBeast, spirits }, null, 1))
console.log(`badges ${badges.length} (unique beasts) | floors ${floors.length} | spirits ${spirits.length}`)
console.log('beasts:', badges.map((b) => b.beast).join(', '))
console.log('->', path.relative(process.cwd(), OUT))
