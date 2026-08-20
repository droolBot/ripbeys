# Rip Beys — design system

Reference: [tanushkumar.in](https://tanushkumar.in/)  
Subject: a Beyblade X + Burst archive. Job of the home page: make someone *want* to spin a bey, then send them into the catalogue or the 3D lab.

This is not a clone of Tanush’s palette or copy. It is a translation of his **funk**: illustration-first hero, glass pill chrome, pixel mega-type, handwritten stickers, marquees, stacked section titles, and a fade into black.

---

## Why the last versions failed

They read as a product landing template: left-aligned kicker, huge Orbitron headline, two CTAs, stats row, card grid, cyan/lime chrome. Tanush’s site works because the **art is the page** and the UI floats on top like stickers and glass. Rip Beys already has Season 3 key art — treat it like his sunset painting, not like a background behind a brochure.

---

## Personality

| Axis | Choice |
|---|---|
| Tone | Playful, loud, a little scrapbook |
| Energy | High |
| Audience | Bladers who like drops, merch, and spinning things |
| Risk | Pixel mega-titles + yellow burst sticker on official key art |

Do **not** go corporate archive. Do **not** go generic neon-on-black SaaS. Do **not** stack three overlapping mix-blend heroes. One painting. UI floats.

---

## Colour

Tanush uses black, electric yellow stickers, glass white, and illustration colour. Rip Beys maps that onto the official X field.

| Token | Hex | Use |
|---|---|---|
| `--void` | `#000000` | Page ground after the hero fade |
| `--ink` | `#F5F5F5` | Type on dark |
| `--glass` | `rgba(0,0,0,0.32)` | Nav / pill buttons over art |
| `--line` | `rgba(255,255,255,0.18)` | Glass edges |
| `--sticker` | `#FFEA00` | Starburst “rip” sticker (the funky hit — same role as his “Hi”) |
| `--sticker-ink` | `#111111` | Type on sticker |
| `--cyan` | `#13FFF3` | X energy, links, 3D ring |
| `--lime` | `#A2FF1F` | GP / emphasis, never the whole UI |
| `--red` | `#EF4139` | Attack tags only |

Hero colour comes from the key visual (magenta / city cyan / dusk). Do not paint extra gradients over it except a **bottom fade to black** so WORK can rise out of the dark.

Buttons on the hero are **glass pills** (white hairline, blur), not solid cyan slabs. Solid cyan is reserved for one primary action in dark sections (catalogue / lab).

---

## Type

Load three faces. No Orbitron on this marketing shell.

| Role | Face | Use |
|---|---|---|
| Pixel display | **Pixelify Sans** | Giant section titles: `WORK`, `LAB`, `CREW`, `RIP`. Letter-space like `W O R K`. Stack two copies (fill + outline) like Tanush. |
| Script | **Reenie Beanie** | Sticker word (`rip`), quote, “say hi” moments |
| UI / body | **Nippo** (Fontshare) | Nav, pills, body, captions. 11px nav, ~15–19px body, tracking on small caps |

Hero name lockup (Tanush: `I ' M T A N U S H`):

```
L E T   I T   R I P
```

Pixelify, huge, slightly transparent so the key art shows through. Subline in Nippo caps:

```
BEYBLADE X  /  BURST ARCHIVE
```

Section titles are **duplicates**: a faint oversized outline sitting behind a sharper fill. Subtitle in Nippo: `A CURATED COLLECTION`.

---

## Layout

```
[ glass pill nav — RIPBEYS          HOME  WORK  LAB  CREW  CATALOGUE ]

[ full-bleed Burst key art — `/assets/hero-burst.png` ]
    [ yellow starburst “rip” ]
    [ glass pill  ENTER THE ARCHIVE, sitting under the painted logo ]
    [ fade to black ]
    [ mega WORK peeking from the dark ]

[ marquee: ATTACK | STAMINA | DEFENSE | BALANCE | XTREME DASH | … ]

[ WORK — masonry of official art / news / toys ]
[ LAB  — copy + circular 3D specimen ]
[ CREW — Team Persona portraits ]
[ ABOUT / quote ]
[ say hi — catalogue CTA + footer ]
```

Nav is **one floating pill**, not a 76px corporate bar with region/currency/account. Links are small, tracked, Nippo.

Content width after the hero: `min(1120px, 100% - 40px)`. Hero is full viewport, art `object-fit: cover`, character-weighted like Tanush’s car (our key visual sits right).

Work grid is **uneven** (masonry / mixed spans), not three equal news cards. Images are the product. Captions sit under, small.

---

## Signature (the one memorable thing)

**Key art as the whole first screen, with a yellow burst sticker and a glass pill CTA, then a pixel `WORK` rising out of the black fade.**

If that moment is weak, the rest of the site will still feel like a template.

---

## Motion

Only these:

1. Marquee ticker (CSS, pause on hover, respect reduced motion).
2. Soft fade-up on sections (10–14px, ~0.5s).
3. Work tiles: slight scale on hover (`1.03`), no bounce, no glare, no magnet.
4. Bey in LAB spins on its **own axis**. Camera stays still.

No Ken Burns on the hero. No orbit rings. No count-up as a personality trick.

---

## Copy voice

Short, physical, not “archive / recovered meshes.”

- Hero sub: `BEYBLADE X  /  BURST ARCHIVE`
- CTA: `ENTER THE ARCHIVE` (pill)
- Work kicker: `A CURATED COLLECTION`
- Lab: `HIT THE RAIL` / `THEN SPIN IT`
- Footer: `say hi` energy → `FIND YOUR BUILD`

---

## Components

**Glass pill** — `border-radius: 999px`, `backdrop-filter: blur(16px)`, `1px` white at 18% opacity, Nippo 11px tracked.

**Starburst sticker** — CSS `polygon` or padded circle with jagged clip, `#FFEA00`, Reenie Beanie ~48–56px, slight rotate (`-8deg`).

**Mega title** — Pixelify `clamp(72px, 18vw, 180px)`, tracking `0.18em`, two layers.

**Marquee** — full-bleed black strip, lime/cyan separators, Nippo 12px.

**Work tile** — image only, 12px radius (Tanush uses ~15px), hover scale. No X-cut clip-paths.

**Lab well** — circle, 1px cyan ring, black inside.

---

## Pages

| Route | Treatment |
|---|---|
| `/` | This document, fully |
| `/market` | Same glass nav, black ground, Nippo, work-tile cards |
| `/lab` | Same nav, black canvas, circular specimen |
| `/hub` | Same nav; game replicas keep their own chrome inside |

X / Burst game screens stay as replicas. Do not Pixelify those.

---

## Don’t

- Orbitron / Chakra as the marketing voice
- Solid cyan rectangles as the hero CTA
- “Battle index 01” / region / fake account
- Light-gray bands
- Three overlapping hero images
- Copy Tanush’s maroon `#750000` or his personal illustration

---

## Build order

1. Fonts + tokens from this file.
2. Glass nav.
3. Hero (art, sticker, pixel lockup, glass CTA, fade, mega WORK).
4. Marquee + work masonry.
5. Lab / crew / footer in the same type system.
6. Catalogue + lab inherit nav + ground.
