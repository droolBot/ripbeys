/**
 * Copies the painted effect and background art out of the decode.
 *
 * The landing page was drawing its energy effects with CSS gradients, which is
 * why it read as generic — beyblade.com composites *painted* PNGs
 * (Effect_blue/red/yellow) over its key visual. The game ships the same kind of
 * art, hand-painted with halftone texture and ink strokes; it just was not
 * ingested. Every file below is picked by eye from
 * `reference/decoded/beybladex/screens/Sprite`, not by pattern.
 *
 *   node scripts/copy-fx.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../../reference/decoded/beybladex/screens/Sprite')
const OUT = path.resolve(HERE, '../public/assets/game/fx')

/** [source file, destination name] — renamed so the CSS reads as intent. */
const FILES = [
  // Energy: these are the equivalents of the official site's Effect_* layers.
  ['battle-intro-flare.png', 'flare-lime.png'],
  ['battle-intro-laser.png', 'laser.png'],
  ['ui-flare-01.png', 'flare-wide.png'],
  ['V_ShockWave_Ice_01.png', 'shockwave-ink.png'],
  ['V_ShockwaveFire 1.png', 'shockwave-fire.png'],
  ['vfx_shockwave20.png', 'shockwave-ring.png'],
  ['IMG_Ring_Glow.png', 'ring-glow.png'],
  ['IMG_Ring_Glow_2.png', 'ring-glow-2.png'],
  ['IMG-light-01.png', 'light-01.png'],
  ['IMG-light-02.png', 'light-02.png'],
  ['IMG_Speedline.png', 'speedline.png'],
  ['fx-highlight-1.png', 'highlight-1.png'],
  ['fx-highlight-2.png', 'highlight-2.png'],
  ['BattleScreen_Center_Sparks_Seq_4.png', 'spark.png'],
  // Grounds and motifs: the official site runs bg-episodes / bg-toys behind its
  // sections. `generic-bg` is the game's own light ground — the X-cross weave,
  // stadium rings and floating shards — which is exactly that, and it already
  // matches the paper palette.
  ['generic-bg.png', 'ground-light.png'],
  ['bg-SplashScreen.png', 'ground-dark.png'],
  ['bg-SplashScreen-lines.png', 'ground-lines.png'],
  ['pattern-x-clamp.png', 'motif-x.png'],
  ['tabs-fioriture.png', 'flourish.png'],
  ['IMG-Transition-Triangles.png', 'triangles.png'],
]

/**
 * Character and promo art, from Texture2D rather than Sprite — the folder that
 * went unsearched the longest and holds the one thing the hero was really
 * missing. `News-IMG-01` is a full anime key visual in the official style:
 * three characters, the diagonal lime/blue/red panels, halftone portraits.
 * `exhhhibition-img-*` are product promos on black with lime speed lines.
 * `Group-News` is their news-card chrome — white, clipped corner, lime foot.
 */
const TEX = path.resolve(HERE, '../../reference/decoded/beybladex/screens/Texture2D')
const TEX_FILES = [
  ['News-IMG-01.png', 'keyvisual-crew.png'],
  ['Group-News.png', 'card-frame.png'],
  ['exhhhibition-img-01.png', 'promo-01.png'],
  ['exhhhibition-img-02.png', 'promo-02.png'],
  ['exhhhibition-img-03.png', 'promo-03.png'],
]

fs.mkdirSync(OUT, { recursive: true })
let copied = 0
const missing = []
const take = (dir, list) => {
  for (const [from, to] of list) {
    const src = path.join(dir, from)
    if (!fs.existsSync(src)) {
      missing.push(from)
      continue
    }
    fs.copyFileSync(src, path.join(OUT, to))
    copied++
  }
}
take(SRC, FILES)
take(TEX, TEX_FILES)

const total = FILES.length + TEX_FILES.length
console.log(`fx: copied ${copied}/${total} -> public/assets/game/fx`)
if (missing.length) console.log('missing:', missing.join(', '))
