import { Link } from 'react-router-dom'
import { StaggeredMenu, type StaggeredMenuItem } from './reactbits/StaggeredMenu'
import './reactbits/reactbits-overrides.css'
import './site-nav.css'

type NavArea = 'home' | 'shop' | 'lab' | 'hub'

const links: { to: string; label: string; area: NavArea; hash?: string }[] = [
  { to: '/', label: 'Home', area: 'home' },
  { to: '/#beys', label: 'Beys', area: 'home' },
  { to: '/lab', label: 'Lab', area: 'lab' },
  { to: '/#crew', label: 'Crew', area: 'home' },
  { to: '/market', label: 'Catalogue', area: 'shop' },
]

const menuItems: StaggeredMenuItem[] = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
  { label: 'Beys', ariaLabel: 'Open beys', link: '/#beys' },
  { label: 'Lab', ariaLabel: 'Open 3D Lab', link: '/lab' },
  { label: 'Crew', ariaLabel: 'Open crew', link: '/#crew' },
  { label: 'Catalogue', ariaLabel: 'Open catalogue', link: '/market' },
]

export function MarketingNav({ active, overlay = false }: { active: NavArea; overlay?: boolean }) {
  return (
    <>
      <header className={`site-nav${overlay ? ' site-nav-overlay' : ''}`} data-active={active}>
        <Link to="/" className="site-brand cursor-target" aria-label="Rip Beys home">
          <img className="site-brand-mark" src="/assets/ripbeys-logo.png" alt="" width={36} height={36} />
          <span>RIPBEYS</span>
        </Link>
        <nav className="site-nav-links" aria-label="Archive">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`cursor-target${active === link.area && link.to !== '/#beys' && link.to !== '/#crew' ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <StaggeredMenu
        className="marketing-staggered-menu"
        isFixed
        position="right"
        items={menuItems}
        displaySocials={false}
        displayItemNumbering
        menuButtonColor="#f5f5f5"
        openMenuButtonColor="#f5f5f5"
        accentColor="#FFEA00"
        colors={['#1a1200', '#FFEA00']}
        closeOnClickAway
      />
    </>
  )
}
