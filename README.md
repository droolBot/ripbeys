# RIPBEYS

Beyblade archive + **on-chain marketplace** built for **Solana**, with real-time gameplay sessions on **[MagicBlock](https://www.magicblock.xyz/)** (Ephemeral Rollups).

This repo is the product surface and the asset vault. The long-term shape is not “a Reactbits demo” — it is **own → trade → battle** for recovered Beyblade X / Burst builds, settled on Solana and accelerated where latency matters.

> Beyblade is © Takara Tomy / Hasbro. Meshes and art here are for local / prototype research. Do not redistribute game assets as a commercial drop without rights.

---

## What we’re building

| Layer | Role |
|-------|------|
| **Solana L1** | Canonical ownership, listing, settlement, royalties, and wallet identity |
| **MagicBlock Ephemeral Rollups** | Real-time battle / arena sessions: low latency, gasless UX in-session, then commit results back to Solana |
| **RIPBEYS web** | Catalogue, 3D lab, locker UI, and (soon) wallet + market flows |

### Product loop

1. **Vault** — Browse recovered whole-bey builds (blade · ratchet · bit / layer · disc · driver) with live 3D.
2. **Own** — Mint or claim digital lots tied to those builds (NFT / compressed NFT — TBD).
3. **Trade** — List, bid, and settle on Solana (`/market` is gated **Coming Soon** until the chain path is live).
4. **Rip** — Match and battle in MagicBlock sessions so multiplayer feels like a game, not a 400ms L1 round-trip every hit.

Footer / coming-soon already brand this as **Powered by Solana + MagicBlock**.

---

## Why MagicBlock (not “just Solana”)

Solana is the settlement and ownership layer. Battles need **frame-time** updates (hits, stamina, stadium contact). MagicBlock Ephemeral Rollups give:

- **~1ms block time / low end-to-end latency** for in-session state  
- **Gasless / near-zero fee** UX while the session is delegated  
- **Commit / settle** of outcomes back to Solana when the match ends  

So: **trade on Solana, fight on MagicBlock, prove ownership on Solana.**

Docs: [MagicBlock docs](https://docs.magicblock.gg/) · [magicblock.xyz](https://www.magicblock.xyz/)

---

## Roadmap (chain + product)

### Now (this repo)

- Marketing landing + curated beys  
- **3D Lab** (`/lab`) — inspect assemblies, swap Burst parts  
- Asset catalogue data (`src/lib/assets.ts`) + recovered meshes  
- `/market` → Coming Soon (placeholder for the NFT market)  
- Partner marks: Solana + MagicBlock  

### Next

- [ ] Wallet connect (Solana: Phantom / Solflare / Wallet Adapter)  
- [ ] On-chain lot mint (Metaplex / cnft) mapped to catalogue IDs  
- [ ] Marketplace program: list / buy / cancel / royalties  
- [ ] MagicBlock session program: create match → delegate → play → settle  
- [ ] Locker UI wired to wallet holdings (not mock)  

### Later

- [ ] Ranked / wagered battles (optional SOL or points)  
- [ ] Stadium / event drops as on-chain editions  
- [ ] Creator / verifier path for community builds (separate from official SKUs)  

---

## Stack today

| Piece | Choice |
|-------|--------|
| App | Vite · React · TypeScript · React Router |
| 3D | three.js (`ModelViewer`) |
| Chain (planned) | Solana + Anchor programs |
| Realtime (planned) | MagicBlock Ephemeral Rollups |
| Hosting | Railway (`ripbeys`) · GitHub `itskika-78/ripbeys` |

```powershell
npm install
npm run dev      # http://127.0.0.1:5173
npm run build
npm start        # serve dist (Railway)
```

| Route | Status |
|-------|--------|
| `/` | Landing / brand |
| `/lab` | 3D Bey Lab |
| `/market` | **Coming Soon** — Solana marketplace |
| `/hub`, `/x/*`, `/burst/*` | Archive / game UI replicas (reference chrome) |

---

## Asset → on-chain mapping (intent)

Catalogue listings in `src/lib/assets.ts` are the **canonical product IDs** (`bx-002`, etc.). Chain work should:

1. Treat each **whole-bey** listing as a mintable lot (not loose VFX / UI meshes).  
2. Store metadata URI pointing at name, series, class, part stack, and poster.  
3. Keep `edition` / `creator` fields as the seed for royalty + scarcity copy.  
4. Use the Lab as the **inspect** surface for an owned mint (same mesh the market shows).

`npm run validate:assets` checks local model / texture references before any mint pipeline trusts a path.

---

## Repo layout (short)

```
src/pages/          Landing, Lab, ComingSoon, archive shells
src/lib/assets.ts   Catalogue + whole-bey filters
src/components/     ModelViewer, PoweredBy, nav
public/assets/      Models, sprites, partner logos
railway.toml        Production build / start
```

Deep UI / decode notes that used to dominate this README live in git history and in `PRD.md` / `design.md` if you need them. **Prefer this file for product + chain direction.**

---

## Links

- [Solana](https://solana.com/)  
- [MagicBlock](https://www.magicblock.xyz/)  
- [MagicBlock docs](https://docs.magicblock.gg/)  
- Official Beyblade: [beyblade.com](https://beyblade.com/)
