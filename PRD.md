# Rip Beys — UI + 3D PRD

Scope for this pass: **look and feel only**. No new routes, no marketplace
mechanics, no dependencies. Everything below is measurable — either the value
matches or it does not.

## 0. The complaint, restated

- The palette is dark and dead.
- There is no layered banner like beyblade.com's.
- The 3D feels bad and fiddly.
- It reads as machine-made.

## 1. Colour — taken off beyblade.com, not invented

Pulled from the live stylesheet (`/_astro/25thanniversary.*.css`) by frequency.
The site is **light**: `#f6f6f6` paper, black type, colour as accent only.

| Token | Value | Source |
|---|---|---|
| `--paper` | `#f6f6f6` | `--tw-gradient-from: #f6f6f6` — the page ground |
| `--surface` | `#ffffff` | cards |
| `--panel` | `#1a1a1a` | `rgb(26 26 26)` dark bands |
| `--panel-2` | `#363636` | `rgb(54 54 54)` |
| `--ink` | `#000000` | `.text-primary` is literally black |
| `--mute` | `#878787` | `rgb(135 135 135)` |
| `--line` | `#dadada` | `rgb(218 218 218)` |
| `--blue` | `#04a8fc` | the X signature |
| `--lime` | `#a2ff1f` | `rgb(162 255 31)` |
| `--yellow` | `#fcee21` | banner accent |
| `--red` | `#ff2f2f` | Rip Beys mark |
| `--red-deep` | `#ac191f` | `rgb(172 25 31)` |
| `--cyan` | `#13fff3` | `rgb(19 255 243)` |

One declaration site: `src/pages/theme.css`. Nothing else may declare a colour
token. **Acceptance:** `grep -c '\-\-red:' src/pages/*.css` returns 1.

Type on the official site is Adobe Typekit `good-times` (display, `font-black`,
uppercase, centred) and `magistral` **italic bold** (everything else). Both are
licensed to them. Free stand-ins with the same skeleton:

- `good-times` → **Orbitron** 700–900. Wide, square, geometric.
- `magistral` → **Chakra Petch**, and the italic is not optional — the slant is
  the site's signature.

**Acceptance:** every `.lp`/`.vault-` heading resolves to Orbitron; every
kicker/ticker resolves to Chakra Petch italic.

## 2. The banner

**The hero is dark, full-bleed art.** `#f6f6f6` is the page ground that begins
*below* it. An earlier pass washed the hero itself in paper, which killed it —
that was the single biggest error in this project's design, and it is worth
stating plainly because the palette table above makes the opposite look right.

The official hero is not one image. It is a plate plus nine cut-out layers,
each on its own z-index and its own entrance, under a transparent nav:

```
nav        w-full h-[84px] md:absolute z-[50]  background: transparent
           left: episode link + bordered SHOP    centre: logo    right: TV
           "Season 3" ⌄ | globe "EN" ⌄ | hamburger
ticker     full-width black band, white italic bold + #FCEE21
BBX_S3_KeyVisual   object-cover, 100vh
bg-gradient-to-t from-[#f6f6f6]  h-[30vh]   <- art dissolves into the page
character-banner  z30   nana z20   jaxon z40   robin z20
Effect_blue  z70   clip-path: inset(0 0 100% 0)     -> wipes up
Effect_yellow z60  scale(0) rotate(-15deg)          -> clash pops
Effect_red   z60   clip-path: inset(0 0 100% 0)
Bey1 z80   Bey2 z80
lockup     xl:left-[60px] bottom-[60px] — logo on `bg-[black]`, then
           `border p-[5px]` wrapping a bordered button on 50% black,
           both in tertiarySky #13fff3
```

Rebuild that composition with our own recovered art, and put the live 3D bey
where their flat `Bey1`/`Bey2` sit — that is the 2D/3D blend.

| Their layer | Ours |
|---|---|
| key visual | `game/keyart/*.png` painted plate |
| character banners | `game/spirits/*.png` — 103 cut-out painted beasts |
| Effect_blue / red / yellow | CSS conic + radial auras in `--blue` / `--red` / `--yellow` |
| Bey1 / Bey2 | **live `ModelViewer`**, plus `game/x-sprites/*.png` flankers |
| fade to `#f6f6f6` | same gradient, same colour |

Perspective is real, not implied: the stage is `perspective: 1200px`, every
layer carries `--depth`, and pointer position drives
`translate3d(x*depth, y*depth, 0)`. Depth ordering must match z-order.

**Acceptance:** ≥7 stacked layers; every one loads (`naturalWidth > 0`);
pointer travel moves foreground and background by different amounts; the plate
covers the full hero width; the nav's three clusters, the lockup and the model
stage have pairwise zero overlap at 1440, 1024 and 375.

## 3. Catalogue cards read as cards, not tiles

Each lot gets: angled corner cut, holo foil sweep on hover, the beast's spirit
art ghosted behind the 3D, the chip badge as a stuck-on decal, a rarity rail
keyed to class, edition + lot number, and the release code strip.

**Acceptance:** a card shows 2D art *and* live 3D simultaneously; the foil
sweep runs on hover only; nothing overflows at 320px.

## 4. 3D that does not fight the user

"Fiddly" is interaction, not shading. Root causes, in order:

1. Scroll-wheel zoom inside a scrolling page traps the pointer. → zoom off
   everywhere except the Lab.
2. Right-drag pan slides the model out of frame with no way back. → pan off.
3. Unclamped polar angle lets you orbit under the floor. → clamp.
4. Hero/card models are decoration; grabbing them is an accident. →
   `interactive={false}` sets `pointer-events: none`.
5. Lighting is tuned for black. On paper the models go flat. → key/fill/rim
   retuned for a light ground, `envMapIntensity` raised.

**Acceptance:** wheel over the hero scrolls the page; the Lab still orbits and
zooms; models read as metal and gloss on `#f6f6f6`.

## 5. Responsive

Breakpoints 1280 / 1000 / 860 / 560 / 380. Every route: no horizontal
overflow, tap targets ≥ 40px, and **no text under 10px** — 10 is the floor for
uppercase tracked micro-labels (edition, spec keys), 12 for anything you
actually read as a sentence.

**Acceptance:** `scrollWidth <= clientWidth` on every route at 375, 768, 1440.

## 6. Out of scope

Wallet, checkout, auth, backend, new 3D assets. Marketplace stays a prototype.

## 7. Assets and IP

beyblade.com's images are **not** copied into this repo. The palette, type
skeleton, composition and choreography are matched; the pixels are our own
decoded art, which is already covered by the local-research rule in the README.
