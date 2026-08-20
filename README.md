# Beyblade web replica

Vite + React + TypeScript + three.js. Renders the meshes recovered from the
Beyblade X and Burst APKs and replicates both apps' screens.

```powershell
npm install
npm run dev     # http://127.0.0.1:5173
npm run validate:assets
npm run build
npm run lint
```

| Route | What |
|-------|------|
| `/` | Rip Beys landing — scroll-driven, explains a bey from scratch |
| `/lab` | Bey Lab — rotate a complete Bey, focus its parts, swap Burst components, read what each does |
| `/market` | Catalogue — recovered Beys and stadium assets, paged live 3D previews |
| `/hub`, `/game` | The archive — frames the two app replicas |
| `/x/*` | Beyblade X: home + battle + gym run live meshes; Beylocker, scan, settings |
| `/burst/*` | Burst QuadStrike: battle menu, shop, customize (live 3D layer), league, profile |

## Focusing a part

`partsOf()` in `src/lib/loadModel.ts` resolves a loaded bey into its real
components — a Burst assembly already has one child per part, and a Beyblade X
export is one mesh tree whose parts come back from the mesh names. The Lab keeps
the build assembled and moves the camera to the selected part's measured bounds.

The landing page uses the complete model as hero decoration; the Bey Lab is the
only route that enables orbit and zoom.

## Model integrity

`npm run validate:assets` checks every catalogue model, texture, and Burst
component reference against `public/assets/models/`, and rejects duplicate lot
IDs. Complete recovered FBX files render directly. Only standalone Burst
`*_Layer.obj` exports are assembled with a recovered disc and driver; this keeps
the full FBX exports from receiving synthetic extra parts.

Every recovered mesh is catalogued except four `fx_*` VFX meshes (attack effects,
not products).
| `/screens` | Emulator screencap reference grid |

## How a recovered mesh gets its colour back

`src/lib/dressMaterials.ts` rebuilds each material, because the exports are
incomplete in two different ways.

**Burst** meshes ship a real `*_Color` albedo per material, so those are kept
as-is.

**Beyblade X** meshes ship *no* albedo at all — Unity tinted each part in the
shader, and AssetStudio's FBX export drops those material properties. What does
survive is the part structure in the mesh and material names
(`Head_metal`, `RatchetRing_3`, `BX17_Mold4`, `Bit_F`, `*_Logo`), so every mould
slot is finished as the part it actually is: die-cast blade ring painted in the
release colour, bare-metal ratchet ring, dark base polymer, steel screws, clear
chip cover, dark bit.

Two sets of real textures ship next to those meshes but are wired to FBX slots
three.js discards on load, so they are re-bound by name instead:

- `*_AO.png` — the baked ambient occlusion for each part
- `BX17_DranSword_3-60f.png` etc. — the printed chip decal (the beast art)

A handful of launcher rings and stadiums (`ripfire*geo.fbx`, `Arena_Main.obj`)
ship no albedo *and* no per-part colour anywhere in the decode — their materials
are literally named `Metal` / `BottomPlastic`. Those render as bare metal and
plastic rather than invented colours.

`scripts/build-part-maps.mjs` resolves mesh → AO/decal once, offline:

```powershell
node scripts/build-part-maps.mjs   # -> src/data/partMaps.json
```

Re-run it after ingesting new models into `public/assets/models/`.

## Finding every bey in the decode

The decoded trees hold ~10,000 files and 883 `*geo.fbx`, but most of those are
parts sharing the same suffix: `SurviveSGeo` and `AmbushGeo` are drivers,
`0DaggerGeo` is a disk plus a driver, `10ExpandGeo` is a disk combo. The one
reliable signal for a real energy layer is a beast name followed by its layer
code — `DiomedesD4`, `AirKnightK5`, `AchillesA8`.

```powershell
node scripts/find-new-beys.mjs --copy   # classify + copy meshes and their maps
node scripts/add-new-beys.mjs           # splice listings into assets.ts
```

`find-new-beys.mjs` copies only the maps a mesh actually references — the export
folders share thousands of PNGs and a blanket copy drags them all in.

## Shading notes

Two things were tried on the geometry; only one survived.

**Creasing the normals does not work here.** These are hard-surface meshes with
authored normals. At any crease angle wide enough to round a blade sweep, the
flat panels smooth too, and their triangulated n-gons shade as a visible fan —
worse than the faceting it was meant to fix. Authored normals are now left
alone; `toCreasedNormals` runs only when a mesh arrives with none.

**Shadows are on in `ModelViewer` only.** A PCF soft shadow from the key light
onto an invisible `ShadowMaterial` plane grounds the bey. The shared card stage
does not enable them — that would be a shadow pass per visible card.

**Lighting is tuned for paper, not black.** Hemisphere bounce comes *up* off the
ground, the rim is nearly as strong as the key (on `#f6f6f6` it is what draws
the edge of a dark bit, which otherwise dissolves into the page), and
`envMapIntensity` is raised — against a light ground a timid env map leaves
die-cast metal and grey plastic looking like the same matte slab. `ModelViewer`
and `ModelStage` share the rig on purpose; the same bey lit two ways between a
card and its detail view is what reads as unfinished.

## Interaction: `interactive={false}` is the default everywhere but the Lab

"The 3D feels fiddly" was never about shading. It was four things, all fixed in
`ModelViewer`:

- Scroll-wheel zoom inside a scrolling page traps the pointer → `enableZoom`
  follows `interactive`.
- Right-drag pan slides the bey out of frame with no way back → `enablePan` off.
- Unclamped polar angle orbits under the floor, where the model reads as a flat
  disc and the shadow plane cuts across it → clamped to 0.18π–0.82π.
- A hero or card model is decoration you scroll past, and OrbitControls sets
  `touch-action: none` the moment it attaches, so on a phone a finger landing on
  the bey could not scroll the page at all → decorative viewers set
  `pointer-events: none` and hand the pointer back to the document.

## Complete beys only

A Burst release is **Layer + Forge Disc + Driver**, and the export ships those
as three separate meshes — so a lone `*_Layer.obj` is a part, not a beyblade.
The catalogue lists finished blades only; loose layers, drivers, launcher rings
and aux blades were dropped.

Burst listings assemble at load time from `src/data/burstParts.json`. Discs and
drivers are interchangeable across the line, so a listing uses its own parts
where the export named them and an archive pairing otherwise, picked by a hash
of the lot id so a listing always shows the same build. Regenerate with:

```powershell
node scripts/build-burst-builds.mjs --copy
```

Seat depth lives in `STACK_OVERLAP` in `src/lib/loadModel.ts` — a layer is
hollow underneath and swallows the top of the disc, so the parts overlap
rather than butt together.

## Artwork, not CSS shapes

The site is built on art recovered from the games rather than drawn for it:

- `public/assets/game/badges/` — 192 unique **beast portraits**: the X foil chip
  art (`BX*`) plus the Burst spirit thumbnails (`spirit_thumb_*`). Scattered as
  sticker walls on the landing and stuck on each lot as a decal.
- `public/assets/game/floors/` — 18 **painted stadium floors**, used as the
  turning surface under the bey in the hero and the Bey Lab.
- `public/assets/game/spirits/` — 103 **beast spirit renders**, the creatures
  themselves as painted character art. The landing runs them on a two-lane
  marquee; the Bey Lab shows each bey's own beast beside its live 3D.
  Matching is by longest key, and spirit names carry a system prefix the listing
  does not (`archerHercules` for "Hercules H4"), so the bare beast word is a key
  too — that lifts Burst coverage from 48% to 77%.
- `public/assets/game/keyart/` — 17 **painted key-art plates**: the clash
  banner, energy backdrops and stadium environments. The landing layers these
  behind the live 3D the way the official site puts illustration behind product.

- `public/assets/game/fx/` — the **painted effect and background art**. This is
  the set that was missing longest, and its absence is why the page read as
  generic: the energy was being drawn with CSS gradients while beyblade.com
  composites painted `Effect_blue/red/yellow` PNGs over its key visual. The game
  ships the same class of art — bursts with halftone dots and ink spikes, lens
  flares, light blooms — plus `ground-light.png`, the game's own X-cross weave
  background, which now sits behind the light sections the way `bg-toys.png`
  does on theirs.

```powershell
node scripts/copy-fx.mjs
```

Regenerate the index after adding more:

```powershell
node scripts/build-art.mjs
```

### Compositing recovered VFX: measure the alpha first

These files are authored for a game engine, not for CSS, and they come in two
incompatible kinds. Guessing produced opaque rectangles across the hero three
times running.

| File | Measured | Correct route |
|---|---|---|
| `ring-glow`, `light-01`, `spark`, `shockwave-ring` | 45–72% fully transparent, corner alpha 0 | `mask-image` over a flat `--fx`, so the palette owns the colour |
| `flare-lime`, `flare-wide` | **100% opaque**, corner alpha 255, painted on black | `mix-blend-mode: screen` |
| `shockwave-ink` | greyscale, RGB == alpha, **flat alpha-22 floor over the whole frame** | mask, `mask-composite: intersect` with a radial falloff to kill the floor |

That last one is the subtle one: as a plain alpha mask the floor paints a faint
tinted square with hard edges, and compositing it with `screen` instead floods
the square bright, because its RGB is not dark.

**Blending needs an un-isolated ancestor.** `mix-blend-mode` only blends with
the backdrop inside its own stacking context, and `.lp-cast` created one three
different ways before this was right — `transform-style: preserve-3d`, then
`z-index: 2`, then `translate: -50%` for centring. Any one of them turned the
flares into black boxes. It is centred with `margin-inline: auto` and left at
`z-index: auto` for exactly that reason; the children keep their own z-indexes.

Badges are matched to a release by beast word, **within its own series** — the
art is named in the Japanese order (`Dran Dagger`) while releases use the
English one (`Dagger Dran`), and without the series split a Burst `Wizard
Fafnir` happily claims the X badge for `Wizard Arrow`. 301 of 356 beys match;
the rest have no shipped portrait.

## Two design languages, on purpose

The marketing surface (`/`, `/lab`, `/market`, `/hub`) follows beyblade.com:
`#f6f6f6` paper, black type, colour only as accent. Those values were read off
their live stylesheet rather than eyeballed — see `PRD.md` §1 for the table and
`src/pages/theme.css` for the tokens. **That file is the only place a colour
token may be declared**; both shells import it, so the two surfaces cannot
drift apart again.

Their display face is Adobe Typekit `good-times` and their body is `magistral`,
always italic and always bold. Both are licensed to them, so the free faces with
the same skeleton stand in: **Orbitron** 700–900 for the square wide caps,
**Chakra Petch** for the rest — and the italic is not optional, it is the single
most recognisable thing about their typography.

The replicas under `/x/*` and `/burst/*` deliberately keep the games' own chrome
— lime for X, cyan for Burst, dark ground painted on `.app-root` — because they
are recreations, not our product. `/hub` is the seam between the two and says so.

## The hero is a stack, not a picture

**The hero is dark, full-bleed art.** `#f6f6f6` is the page ground that starts
*below* it. Getting that backwards — washing the hero itself in paper because
the palette table says the site is light — is the one mistake that makes the
whole page collapse. The art ends only by dissolving into the paper over the
last `30vh`, which is their gradient exactly.

beyblade.com's hero is one plate under nine cut-out layers, each on its own
z-index with its own entrance, under a **transparent absolute nav** (84px, not
sticky) and a full-width black announcement band. `.lp-hero` rebuilds that
composition from our own recovered art: painted plate, two spirit beasts
flanking, three effect auras in the brand blue/red/yellow, two product renders —
and the **live 3D build** where their flat `Bey1`/`Bey2` sit. That substitution
is the whole point of the site.

Bottom-left carries their lockup: the wordmark on a solid black plate, then a
double-bordered button — outer `border` + `padding: 5px` wrapping a bordered
inner span on 50% black — in their `tertiarySky`, `#13fff3`.

Depth is real. The stage carries `perspective`, each layer carries `--depth`,
and the pointer handler writes `--px`/`--py` **once on the container** — the
per-layer offset is CSS multiplying by its own depth, so nine images move on
the compositor instead of through React. Measured: foreground travels 26px
where the background travels 8.4px.

The cast is a single centred, bottom-anchored box and every layer is placed as a
percentage of it, so the composition scales as one instead of drifting apart.
There is no headline over the art — theirs has none either; the value line and
the stats live in `.lp-intro`, the first band on paper, where their news
carousel sits.

### Verify by screenshot, not by measurement

The in-app Browser pane does not composite frames, so its screenshot tool always
fails and every check has to be numeric. DOM geometry proved the hero's layout
was correct while the page still looked terrible, because the numbers cannot see
colour. Headless Chrome can, and it is already installed:

```bash
chrome.exe --headless --no-sandbox --disable-gpu --hide-scrollbars --window-size=1440,900 --virtual-time-budget=8000 --user-data-dir=<fresh> --screenshot=<abs win path> http://127.0.0.1:5173/
```

The path must be a Windows absolute path or the write is denied, the profile
must be fresh, and `chrome.exe` regularly fails to exit — kill it between runs
or the next invocation silently hangs. Use `--timeout=<ms>`, not
`--virtual-time-budget`: the latter never completes once the page holds a
`requestAnimationFrame` loop inside an iframe.

Two further limits and the way around both. Chrome enforces a **minimum window
width**, so `--window-size=390,844` fails outright; and the CLI **cannot
scroll**, while the hero (`100vh`) and the anatomy scrub (`280vh`) are sized in
viewport units — a taller window just grows them and photographs the same thing
bigger. A throwaway `public/_shot.html` solves all of it: a same-origin iframe
at any width, `pin` to override those two heights in px, and `y` to shift the
inner document with a negative margin instead of scrolling. Delete it after use.
(Inline scripts ignore `defer` — put it at the end of `<body>` or
`document.body` is null and you get no iframe and no error.)

That is how the plate got picked. Sampling every candidate for mean luminance
and saturation: `battle-intro-bg-left` is **0.775 / 0.037** — a near-white,
near-greyscale floor, chosen blind on the first pass and the reason the hero
looked washed out. `Environment_Blue` is **0.231 / 0.596**. A key visual has to
be dark and saturated or white type has nothing to sit on and the
`mix-blend-mode: screen` auras come out as pastel smudges.

Six bugs only a screenshot could have caught:

- The roster wall's headline was **completely buried** under the chip wall.
  `.lp-wall-art` was `position: absolute` with no `z-index`, so it made no
  stacking context and each chip's own `z-index` (1–5) competed directly with
  the scrim (1) and the copy (2). `z-index: 0` on the wrapper is load-bearing.
- `spirit_thumb_base` and `spirit_thumb_base_inner` are the **empty hex frame**
  the beasts composite into, not beasts — 0% opaque, 0% saturated. They rode the
  landing marquee as blank hexagons. `build-art.mjs` filters them now: 101, not
  103.
- The four type cards took brand colours while their emblems carry the **game's
  own type colours**, so a red bar sat under a blue Attack icon. Sampled from
  the sprites into `--type-*`: attack `#116fb6`, defense `#0b964b`, stamina
  `#ee8917`, balance `#db0818`.


- The stadium floor disc and the 3D shadow plane both read as a **grey smear**
  over painted art — they grey out whatever is behind the model. The hero passes
  `ground={false}` and drops the floor; the catalogue hero does the same on its
  white specimen well, where the shadow landed as a hard grey polygon.
- The scrim exists because a plate alone is not a key visual: it needs a
  vignette, a top band for the nav type, and a cool cast.
- At 390 the centred wordmark ran straight through the right cluster. Their nav
  is `justify-start sm:justify-center` for exactly this reason — the mark goes
  hard left on mobile.

Two more found by measuring rather than looking:

- `index.css` sets a global `img { max-width: 100% }`, which capped the
  full-bleed plate at the hero's own width. Starting it at `-3%` then left a
  43px strip of bare backdrop down the right edge. `.lp-plate` needs
  `max-width: none`.
- `.lp-aura-clash` centres itself with `translate: -50% 0`, and the shared
  `.lp-cast > *` parallax rule also writes `translate` — the later rule won and
  the spark jumped half its width. Its offset rides on `transform` instead.

No image from beyblade.com is copied into this repo — palette, type skeleton,
composition and choreography are matched; the pixels are the local decode.

## Models

All meshes come from the local decode of the shipped APKs (5,230 files under
`reference/decoded/`), not from third-party model sites.

That was checked rather than assumed. CGTrader's Beyblade listings are fan
recreations and 3D-print STLs (`Dranzer V` $10 .stl, `Bakuten Shooter` $50 .stl,
a few free low-poly .blend/.fbx); Cults3D and MakerWorld are print files; Meshy
is an AI text-to-3D generator. None ship separated layer/disc/driver parts with
the original textures. The local extraction does, so nothing online improves on
it — and it keeps the "all of them real" claim on the landing page honest.

Add fan models only in a clearly separate section if that changes.

## Design

The marketplace is styled as a component exchange rather than a token drop: the
palette is drawn from what the parts are made of (graphite, brass, cold steel),
and the motif is the release code itself — `3-60F` splits into ratchet 3,
height 60 mm, bit F, which heads every listing.

Type is **Archivo Black** for the heavy statements and **Chakra Petch** for
everything technical — the latter's clipped corners and squared terminals echo
the Beyblade X wordmark. Both load from Google Fonts with `Arial Black` /
`Rajdhani` fallbacks; self-host under `public/fonts/` to render offline.

Archivo Black ships a single weight. Anything using `--display-xl` must ask for
`font-weight: 400`, or the browser synthesises a bold and smears the counters at
display size.

## Bey artwork

`public/assets/game/x-sprites/` holds the X app's own colour bey renders, pulled
from its UI atlas. Two traps when adding more:

- Several files under `game/beys/` are greyscale **AO bakes** that happen to be
  named after a bey (`SwordDran.png`, `TailViper.png`). They are not artwork.
- Some sprites have the in-game **"custom paint" badge** composited into the
  bottom-right corner. Prefer the `*Full` or `*_<id>` variant, which is clean.

Both are detectable by sampling pixels — greyscale bakes have near-zero
saturation; the badge is a large flat near-white block in the corner.

## Other scripts

| Script | What |
|--------|------|
| `scripts/copy-model-textures.ps1` | Copies each model's sibling textures next to it |
| `scripts/wire-color-maps.ps1` | Picks the canonical `*_Color` map per listing |
| `scripts/ingest-new-uploads.ps1` | Adds new FBX/OBJ exports to the catalog |
| `scripts/inspect-fbx.mjs` | Prints mesh/material info for a few models |

> Beyblade is © Takara Tomy / Hasbro. Assets here are local research only.
