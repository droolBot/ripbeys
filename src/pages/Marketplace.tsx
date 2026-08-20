import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ModelViewer } from '../components/ModelViewer'
import { ModelSlot, ModelStageProvider } from '../components/ModelStage'
import { MarketingNav } from '../components/MarketingNav'
import CountUp from '../components/reactbits/CountUp'
// import GlareHover from '../components/reactbits/GlareHover'
// import Magnet from '../components/reactbits/Magnet'
import { isWholeBeyListing, marketplaceListings, productRenderFor, type Listing } from '../lib/assets'
import { spiritUrl } from '../lib/spirits'
import './marketplace.css'

function stackOf(item: Listing) {
  return item.assembly === 'burst' && item.parts?.every((part) => part.src)
    ? item.parts.map((part) => ({ src: part.src!, texture: part.texture, tint: item.tint, role: part.role }))
    : undefined
}

function partLine(item: Listing) {
  return item.parts?.length
    ? item.parts.map((part) => part.name).join(' · ')
    : item.combinationStatus === 'complete-mesh'
      ? 'Complete recovered mesh'
      : 'Product archive render'
}

function ProductCard({ item, index, onOpen }: { item: Listing; index: number; onOpen: () => void }) {
  const spirit = spiritUrl(item.name)
  const poster = productRenderFor(item)
  return (
    <article className="shop-card" style={{ '--product-accent': item.accent } as CSSProperties} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }} tabIndex={0} role="button" aria-label={`Inspect ${item.name}`}>
      <div className="shop-card-art">
        <span className="shop-card-number">{String(index + 1).padStart(2, '0')}</span>
        {spirit && poster && <img className="shop-card-spirit" src={spirit} alt="" loading="lazy" />}
        {item.badge && <img className="shop-card-chip" src={item.badge} alt="" loading="lazy" />}
        {poster && <img className="shop-card-poster" src={poster} alt={item.name} loading="lazy" />}
        {item.model && <ModelSlot src={item.model} texture={item.texture} tint={item.tint} stack={stackOf(item)} className="shop-card-model" />}
        {!poster && <span className="shop-card-live">Live 3D preview</span>}
        {/* <GlareHover className="shop-card-glare" width="100%" height="100%" background="transparent" borderRadius="0" borderColor="transparent" glareColor="#f1eee7" glareOpacity={0.12} glareSize={170} /> */}
        <span className="shop-card-status">Sold out</span>
        <span className="shop-card-foil" aria-hidden="true" />
      </div>
      <div className="shop-card-copy">
        <span>{item.series} series · {item.class}</span>
        <h2>{item.name}</h2>
        <p>{partLine(item)}</p>
        <strong>${item.price.toFixed(2)} USD</strong>
      </div>
    </article>
  )
}

function ProductCode({ item }: { item: Listing }) {
  return (
    <dl className="shop-code">
      {(item.parts?.length ? item.parts.map((part) => ({ label: part.role, value: part.name })) : [
        { label: 'Series', value: item.series },
        { label: 'Type', value: item.class },
        { label: 'Format', value: item.model?.split('.').pop()?.toUpperCase() ?? '—' },
      ]).map((cell) => (
        <div key={cell.label}><dt>{cell.label}</dt><dd>{cell.value}</dd></div>
      ))}
    </dl>
  )
}

export function Marketplace() {
  const [series, setSeries] = useState<'All' | 'X' | 'Burst'>('All')
  const [type, setType] = useState<'All' | Listing['class']>('All')
  const [sort, setSort] = useState('Featured')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Listing | null>(null)
  const [reserved, setReserved] = useState(false)
  const pageSize = 24

  const catalog = useMemo(() => marketplaceListings.filter((item): item is Listing => Boolean(item?.id && item?.name) && isWholeBeyListing(item)), [])
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = catalog.filter((item) =>
      (series === 'All' || item.series === series) &&
      (type === 'All' || item.class === type) &&
      (!term || `${item.name} ${item.series} ${item.class} ${partLine(item)}`.toLowerCase().includes(term)),
    )
    if (sort === 'Price low') return [...filtered].sort((a, b) => a.price - b.price)
    if (sort === 'Price high') return [...filtered].sort((a, b) => b.price - a.price)
    if (sort === 'Name A-Z') return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    return [...filtered].sort((a, b) => Number(Boolean(productRenderFor(b))) - Number(Boolean(productRenderFor(a))))
  }, [catalog, query, series, sort, type])

  useEffect(() => setPage(1), [query, series, sort, type])

  useEffect(() => {
    if (!selected) return
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selected])

  const shown = visible.slice(0, page * pageSize)
  const hero = catalog.find((item) => item.id === 'bx-002') ?? catalog[0]
  const beyCount = catalog.filter((item) => item.class !== 'Arena').length

  return (
    <ModelStageProvider>
    <main className="shop-page">
      <MarketingNav active="shop" />

      <section className="shop-intro">
        <div className="shop-intro-copy">
          <span className="shop-eyebrow">Catalogue / Drop 01</span>
          <h1>Shop<br /><em>the build.</em></h1>
          <p>Recovered Beys from X and Burst. Every card is a real release, every model is mapped to the archive.</p>
          <div className="shop-intro-stats"><span><b><CountUp to={beyCount} separator="," /></b><small>Beys</small></span><span><b><CountUp to={catalog.length} separator="," /></b><small>Total lots</small></span><span><b>3D</b><small>Lab ready</small></span></div>
        </div>
        <div className="shop-intro-product">
          <span>Featured / {hero.id.toUpperCase()}</span>
          <ModelViewer src={hero.model!} texture={hero.texture} tint={hero.tint} poster={productRenderFor(hero) ?? hero.image} height="100%" interactive={false} ground={false} autoRotate={false} spinAxis spin={1.15} presentation="hero" />
          <strong>{hero.name}</strong>
          <small>{hero.series} series · {hero.class}</small>
        </div>
      </section>

      <section className="shop-catalogue" id="market">
        <header className="shop-section-head"><div><span className="shop-eyebrow">All releases</span><h2>Catalogue</h2></div><p>{shown.length} of {visible.length} products</p></header>
        <div className="shop-controls">
          <div className="shop-tabs">{(['All', 'X', 'Burst'] as const).map((value) => <button key={value} type="button" className={series === value ? 'active' : ''} onClick={() => setSeries(value)}>{value === 'All' ? 'All products' : `${value} series`}</button>)}</div>
          <label className="shop-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Beys" /></label>
          <label className="shop-select"><select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="All">All types</option><option value="Attack">Attack</option><option value="Defense">Defense</option><option value="Stamina">Stamina</option><option value="Balance">Balance</option><option value="Arena">Arenas</option></select><ChevronDown size={14} /></label>
          <label className="shop-select"><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Featured</option><option>Name A-Z</option><option>Price low</option><option>Price high</option></select><ChevronDown size={14} /></label>
        </div>
        <div className="shop-grid">{shown.map((item) => <ProductCard key={item.id} item={item} index={visible.indexOf(item)} onOpen={() => { setSelected(item); setReserved(false) }} />)}</div>
        {shown.length < visible.length && (
          <button className="shop-more" type="button" onClick={() => setPage((value) => value + 1)}>Load more products</button>
        )}
      </section>

      <footer className="shop-footer"><span>RIP BEYS / PRODUCT ARCHIVE</span><small>Assets decoded for local research only.</small><Link to="/lab">Open the 3D Lab</Link></footer>

      <AnimatePresence>
        {selected && (
          <motion.div className="shop-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.section className="shop-modal" role="dialog" aria-modal="true" aria-label={`${selected.name} product details`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(event) => event.stopPropagation()}>
              <button className="shop-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close product"><X size={20} /></button>
              <div className="shop-modal-stage"><ModelViewer src={selected.model!} texture={selected.texture} tint={selected.tint} stack={stackOf(selected)} poster={productRenderFor(selected)} height="100%" ground={false} /></div>
              <div className="shop-modal-info">
                <span className="shop-eyebrow">{selected.series} series · {selected.class}</span>
                <h2>{selected.name}</h2>
                <ProductCode item={selected} />
                <small className="shop-provenance">{selected.partsVerified ? 'Release reference checked' : selected.verificationSource ?? 'Game export; release match not asserted'}</small>
                <p>Recovered from the shipped game build and presented with the available release geometry and materials.</p>
                <div className="shop-modal-buy"><span><small>Price</small><b>${selected.price.toFixed(2)} USD</b></span><button type="button" onClick={() => setReserved(true)}>{reserved ? 'Reserved' : 'Reserve specimen'}</button></div>
                <small className="shop-modal-note">Prototype catalogue. No payment or transaction is performed.</small>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
    </ModelStageProvider>
  )
}
