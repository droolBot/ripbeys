import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import GlitchText from './GlitchText'
import './GlitchBoot.css'

type GlitchBootProps = {
  onUnlock: () => void
  onDone: () => void
  onMorph?: () => void
}

export default function GlitchBoot({ onUnlock, onDone, onMorph }: GlitchBootProps) {
  const [leaving, setLeaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const finished = useRef(false)
  const unlocked = useRef(false)
  const morphed = useRef(false)
  const touchY = useRef(0)
  const target = useRef(0)
  const current = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const lastTs = useRef(0)
  const lastDocWrite = useRef(-1)

  useEffect(() => {
    setMounted(true)
    const t = window.setTimeout(() => setReady(true), 24)
    return () => window.clearTimeout(t)
  }, [])

  const paint = useCallback((value: number) => {
    current.current = value
    const node = rootRef.current
    // slightly coarser writes — smoother compositor path
    const rounded = Math.round(value * 250) / 250
    if (node) node.style.setProperty('--boot-pull', rounded.toFixed(3))
    if (Math.abs(rounded - lastDocWrite.current) >= 0.008) {
      lastDocWrite.current = rounded
      document.documentElement.style.setProperty('--boot-pull', rounded.toFixed(3))
    }
    if (value > 0.03) node?.classList.add('is-pulling')
    else node?.classList.remove('is-pulling')
  }, [])

  const handoff = useCallback(() => {
    if (finished.current) return
    finished.current = true
    if (!unlocked.current) {
      unlocked.current = true
      onUnlock()
    }
    if (!morphed.current) {
      morphed.current = true
      onMorph?.()
    }
    target.current = 1
    paint(1)
    document.documentElement.style.setProperty('--boot-pull', '1')
    setLeaving(true)
    window.scrollTo(0, 0)
    window.setTimeout(() => onDone(), 420)
  }, [onUnlock, onDone, onMorph, paint])

  useEffect(() => {
    if (!mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--boot-pull', '1')
      onUnlock()
      onMorph?.()
      onDone()
      return
    }

    const tick = (ts: number) => {
      if (!lastTs.current) lastTs.current = ts
      const dt = Math.min(32, ts - lastTs.current) / 16.67
      lastTs.current = ts
      // soft ease — shutter feels weighted, not springy
      const k = 1 - Math.pow(0.86, dt)
      const next = current.current + (target.current - current.current) * k
      const settled = Math.abs(target.current - next) < 0.0012
      paint(settled ? target.current : next)

      // unlock page under shutter early so hero can fade in
      if (!unlocked.current && current.current >= 0.18) {
        unlocked.current = true
        onUnlock()
      }
      if (!morphed.current && current.current >= 0.28) {
        morphed.current = true
        onMorph?.()
      }
      if (!finished.current && current.current >= 0.992) {
        handoff()
        rafRef.current = 0
        lastTs.current = 0
        return
      }
      if (settled) {
        rafRef.current = 0
        lastTs.current = 0
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    const kick = () => {
      if (!rafRef.current) {
        lastTs.current = 0
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    const push = (delta: number) => {
      if (finished.current) return
      target.current = Math.min(1, Math.max(0, target.current + delta))
      kick()
    }

    const onWheel = (event: WheelEvent) => {
      if (finished.current) return
      if (event.deltaY <= 0) {
        if (target.current > 0.001 && target.current < 1) {
          event.preventDefault()
          push(event.deltaY / 1050)
        }
        return
      }
      event.preventDefault()
      push(Math.min(0.1, event.deltaY / 780))
    }

    const onKey = (event: KeyboardEvent) => {
      if (finished.current) return
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        push(0.22)
      }
    }

    const onTouchStart = (event: TouchEvent) => {
      touchY.current = event.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (event: TouchEvent) => {
      if (finished.current) return
      const y = event.touches[0]?.clientY ?? touchY.current
      const dy = touchY.current - y
      touchY.current = y
      if (Math.abs(dy) < 3) return
      event.preventDefault()
      push(dy / 580)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [mounted, paint, handoff, onUnlock, onDone, onMorph])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={rootRef}
      className={`rb-boot${ready ? ' is-ready' : ''}${leaving ? ' is-out' : ''}`}
      role="dialog"
      aria-label="Rip Beys intro — scroll to enter"
      style={{ ['--boot-pull' as string]: '0' }}
    >
      <div className="rb-boot-veil" aria-hidden="true" />
      <div className="rb-boot-stack">
        <img className="rb-boot-logo" src="/assets/ripbeys-logo.png" alt="" width={88} height={88} draggable={false} />
        <GlitchText speed={1} enableShadows enableOnHover={false} className="rb-boot-glitch-text">
          RIPBEYS
        </GlitchText>
        <div className="rb-boot-scroll" aria-hidden="true">
          <span>Scroll to enter</span>
          <i />
        </div>
      </div>
      <div className="rb-boot-rail" aria-hidden="true">
        <span />
      </div>
    </div>,
    document.body,
  )
}
