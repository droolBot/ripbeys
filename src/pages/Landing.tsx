import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ModelViewer } from '../components/ModelViewer'
import { MarketingNav } from '../components/MarketingNav'
import { PoweredBy } from '../components/PoweredBy'
import { FEATURED_BEY_IDS, listingById, productRenderFor } from '../lib/assets'
// Once-only boot gate — disabled so GlitchBoot plays on every home reload.
// import { hasSeenBoot, markBootSeen } from '../lib/bootGate'
import ClickSpark from '../components/reactbits/ClickSpark'
import Magnet from '../components/reactbits/Magnet'
// import ScrollExpand from '../components/reactbits/ScrollExpand'
import ASCIIText from '../components/reactbits/ASCIIText'
import GlitchBoot from '../components/reactbits/GlitchBoot'
import ScrollRise from '../components/reactbits/ScrollRise'
import './landing-x.css'

const HERO_BEY_ID = 'bx-002'
const heroBey = listingById(HERO_BEY_ID) ?? listingById(FEATURED_BEY_IDS[0])
const heroModel = heroBey?.model ?? '/assets/models/dagger_dran.fbx'
const heroPoster = (heroBey && productRenderFor(heroBey)) ?? heroBey?.image ?? '/assets/game/x-sprites/DaggerDran_Product.png'
const heroLabTo = `/lab?bey=${heroBey?.id ?? HERO_BEY_ID}`
const art = '/assets/official'
// const sprites = '/assets/game/x-sprites'

const ticker = ['ATTACK', 'STAMINA', 'DEFENSE', 'BALANCE', 'XTREME DASH', 'SEASON 3', 'XENON CITY', 'TEAM PERSONA', 'BURST', 'LET IT RIP']

const tags = [
  { label: 'Attack type', color: '#c8ff00', ink: '#111', rot: -14, style: { top: '22%', left: '5%' } },
  { label: 'Graphic spin', color: '#7c3aed', ink: '#fff', rot: 10, style: { top: '58%', left: '7%' } },
  { label: 'Xtreme dash', color: '#ff4d9a', ink: '#fff', rot: 8, style: { top: '28%', right: '6%' } },
  { label: 'Balance', color: '#13fff3', ink: '#111', rot: -7, style: { top: '52%', right: '8%' } },
  { label: 'Let it rip', color: '#ffea00', ink: '#111', rot: 12, style: { bottom: '18%', right: '12%' } },
]

/** Curated tiles use the same lab mesh (static) for each featured bey. */
const work = FEATURED_BEY_IDS.map((id) => listingById(id)).flatMap((item) =>
  item?.model
    ? [
        {
          id: item.id,
          model: item.model,
          texture: item.texture,
          tint: item.tint,
          poster: productRenderFor(item) ?? item.image,
          label: item.name.replace(/\s+[A-Z]*\d-\d{2}[A-Z]+$/i, '').trim() || item.name,
          to: `/lab?bey=${item.id}`,
        },
      ]
    : [],
)

const types = [
  { n: '01', kicker: 'Type', title: 'Attack', accent: '#13fff3', points: ['Rail burst first', 'High burst risk', 'Sword Dran family'] },
  { n: '02', kicker: 'Type', title: 'Stamina', accent: '#ef4139', points: ['Outlast the pocket', 'Low recoil bits', 'Keep the spin'] },
  { n: '03', kicker: 'Type', title: 'Defense', accent: '#ef4139', points: ['Hold the center', 'Heavy ratchets', 'Absorb the dash'] },
  { n: '04', kicker: 'Type', title: 'Balance', accent: '#ef4139', points: ['Switch on contact', 'All-round builds', 'Read the stadium'] },
]

const crew = [
  { name: 'Jaxon Cross', role: 'Blader X', image: `${art}/jaxon.webp`, bey: 'Sword Dran', beyArt: `${art}/jaxon-bey.webp` },
  { name: 'Robin Kazami', role: 'Never give up', image: `${art}/robin.webp`, bey: 'Reaper Incendio', beyArt: `${art}/robin-bey.webp` },
  { name: 'Multi Nana-iro', role: 'Beycrafter', image: `${art}/multi.webp`, bey: 'Arrow Wizard', beyArt: `${art}/multi-bey.webp` },
  { name: 'Nine Cross', role: 'The other X', image: `${art}/nine.webp`, bey: 'Rage Ragna', beyArt: `${art}/nine-bey.webp` },
]

function Mega({ label }: { label: string }) {
  return (
    <div className="rb-mega rb-morph" data-rise-item>
      <h2>{label}</h2>
      <em aria-hidden="true">{label}</em>
    </div>
  )
}

function useHeroParallax(active: boolean) {
  const artRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let current = 0
    let target = 0
    const onScroll = () => {
      target = Math.min(70, window.scrollY * 0.12)
      if (!raf) {
        const tick = () => {
          current += (target - current) * 0.08
          const img = artRef.current
          if (img) img.style.transform = `translate3d(0, ${current}px, 0) scale(1.06)`
          if (Math.abs(target - current) > 0.15) raf = requestAnimationFrame(tick)
          else raf = 0
        }
        raf = requestAnimationFrame(tick)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active])
  return artRef
}

export function Landing() {
  // Boot always runs on mount/reload (localStorage once-only gate disabled).
  // const seen = typeof window !== 'undefined' && hasSeenBoot()
  const [unlocked, setUnlocked] = useState(false)
  const [bootGone, setBootGone] = useState(false)
  const [morphed, setMorphed] = useState(false)
  const unlock = useCallback(() => setUnlocked(true), [])
  const finishBoot = useCallback(() => {
    // markBootSeen()
    setBootGone(true)
  }, [])
  const onMorph = useCallback(() => setMorphed(true), [])
  const heroArt = useHeroParallax(bootGone)

  useEffect(() => {
    document.documentElement.classList.toggle('rb-locked', !unlocked)
    return () => {
      document.documentElement.classList.remove('rb-locked')
      document.documentElement.style.removeProperty('--boot-pull')
    }
  }, [unlocked])

  return (
    <ClickSpark sparkColor="#c8ff00" sparkCount={10} sparkRadius={20}>
      {!bootGone ? (
        <GlitchBoot
          key="rb-glitch-boot"
          onUnlock={unlock}
          onDone={finishBoot}
          onMorph={onMorph}
        />
      ) : null}
      <main className={`rb-page${unlocked ? ' is-live' : ' is-gated'}${morphed || bootGone ? ' is-morph' : ''}`}>
        <MarketingNav active="home" overlay />

        <section className="rb-hero" aria-labelledby="rb-hero-title">
          <img ref={heroArt} className="rb-hero-art" src="/assets/hero-cinematic.png" alt="" fetchPriority="high" decoding="async" />
          <div className="rb-hero-shade" aria-hidden="true" />
          <div className="rb-hero-fade" aria-hidden="true" />
          {tags.map((tag) => (
            <b key={tag.label} className="rb-tag cursor-target" style={{ ...tag.style, background: tag.color, color: tag.ink, rotate: `${tag.rot}deg` }}>
              {tag.label}
            </b>
          ))}
          <p className="rb-sticker cursor-target" aria-hidden="true">rip</p>
          <div className="rb-hero-copy">
            <p className="rb-hero-kicker">Beyblade X · Burst archive</p>
            <h1 id="rb-hero-title" className="rb-hero-punk">
              <span>Let It</span>
              <em>Rip</em>
            </h1>
            <p className="rb-hero-line">Spin recovered builds. Rail the drop.</p>
            <Magnet padding={40} magnetStrength={3}>
              <Link to="/lab" className="rb-explore cursor-target">
                Explore <span aria-hidden="true">→</span>
              </Link>
            </Magnet>
          </div>
        </section>

        <div className="rb-marquee" aria-hidden="true">
          <div>
            {[...ticker, ...ticker].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <section className="rb-ascii" aria-hidden="true">
          {bootGone ? <ASCIIText text="LET_IT_RIP" asciiFontSize={8} textFontSize={180} planeBaseHeight={7} enableWaves /> : null}
        </section>

        <ScrollRise as="section" className="rb-section rb-head" id="beys">
          <Mega label="Beys" />
          <p className="rb-under" data-rise-item>A curated collection</p>
        </ScrollRise>

        <ScrollRise className="rb-masonry" stagger={55}>
          {work.map((item) => (
            <Link key={item.id} className="rb-tile cursor-target" to={item.to} data-rise-item>
              {bootGone ? (
                <ModelViewer
                  src={item.model}
                  texture={item.texture}
                  tint={item.tint}
                  poster={item.poster}
                  height="100%"
                  autoRotate={false}
                  interactive={false}
                  force3D
                  ground={false}
                  presentation="tile"
                />
              ) : (
                <img src={item.poster} alt={item.label} loading="lazy" decoding="async" />
              )}
              <b>{item.label}</b>
            </Link>
          ))}
        </ScrollRise>

        <ScrollRise as="section" className="rb-section rb-head" id="lab">
          <Mega label="Lab" />
          <p className="rb-under" data-rise-item>Live specimen</p>
        </ScrollRise>

        <ScrollRise className="rb-lab-row rb-section" stagger={90}>
          <div data-rise-item>
            <h3>Hit the rail.<br />Then spin it.</h3>
            <p>{heroBey?.name ?? 'Dagger Dran 4-60R'} launches on its own axis. Open the lab to split blade, ratchet, and bit.</p>
            <Magnet padding={40} magnetStrength={3}>
              <Link to={heroLabTo} className="rb-pill rb-pill-solid cursor-target">Open 3D lab</Link>
            </Magnet>
          </div>
          <div className="rb-well cursor-target" data-rise-item>
            {bootGone ? (
              <ModelViewer
                src={heroModel}
                texture={heroBey?.texture}
                tint={heroBey?.tint}
                poster={heroPoster}
                height="100%"
                autoRotate={false}
                spinAxis
                spin={1.15}
                interactive={false}
                force3D
                ground={false}
                presentation="hero"
              />
            ) : (
              <img
                className="rb-well-poster"
                src={heroPoster}
                alt=""
                loading="lazy"
              />
            )}
          </div>
        </ScrollRise>

        <ScrollRise as="section" className="rb-types" id="types" stagger={60}>
          {types.map((item) => (
            <article key={item.n} className="rb-type cursor-target" data-rise-item>
              <small style={{ color: item.accent }}>{item.kicker}</small>
              <b style={{ color: item.accent }}>{item.n}</b>
              <h3>{item.title}</h3>
              <ul>
                {item.points.map((point) => (
                  <li key={point}><span style={{ color: item.accent }}>→</span> {point}</li>
                ))}
              </ul>
            </article>
          ))}
        </ScrollRise>

        <ScrollRise as="section" className="rb-section rb-head" id="crew">
          <Mega label="Crew" />
          <p className="rb-under" data-rise-item>Team Persona</p>
        </ScrollRise>

        <ScrollRise className="rb-crew rb-section" stagger={70}>
          {crew.map((blader) => (
            <article key={blader.name} className="rb-crew-card cursor-target" data-rise-item>
              <img src={blader.image} alt={blader.name} loading="lazy" decoding="async" />
              <div>
                <h3>{blader.name}</h3>
                <p>{blader.role}</p>
                <span>
                  <img src={blader.beyArt} alt="" loading="lazy" decoding="async" />
                  {blader.bey}
                </span>
              </div>
            </article>
          ))}
        </ScrollRise>

        <ScrollRise as="section" className="rb-quote">
          <p data-rise-item>“Let it rip.”</p>
          <small data-rise-item>The only brief that matters.</small>
        </ScrollRise>

        <ScrollRise as="section" className="rb-hi" id="hi" stagger={80}>
          <img src="/assets/hero-cinematic.png" alt="" />
          <p className="rb-hi-script" data-rise-item>say hi</p>
          <h2 data-rise-item>Find your build.</h2>
          <p data-rise-item>Official art, recovered meshes, one catalogue. No payment. Just spin.</p>
          <div data-rise-item>
            <Magnet padding={40} magnetStrength={3}>
              <Link to="/market" className="rb-pill cursor-target">Browse the catalogue</Link>
            </Magnet>
          </div>
        </ScrollRise>

        <footer className="rb-foot">
          <div className="rb-foot-brand">
            <img src="/assets/ripbeys-logo.png" alt="" width={56} height={56} />
            <div>
              <b>RIPBEYS</b>
              <PoweredBy />
            </div>
          </div>
          <small>Beyblade is © Takara Tomy / Hasbro. Art from beyblade.com. Meshes decoded for local research only. Built for MagicBlock on Solana.</small>
          <a className="cursor-target" href="https://beyblade.com/" target="_blank" rel="noreferrer">Official X</a>
        </footer>
      </main>
    </ClickSpark>
  )
}
