import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'
import type { ThemeChoice } from '../../lib/storage'
import styles from './SiteHeader.module.css'

interface Props {
  /** home screen with the hero on show — nav floats transparent until scrolled */
  immersive: boolean
  /** away from home — surface a "New trip" shortcut */
  notHome: boolean
  theme: ThemeChoice
  onToggleTheme: () => void
  onHome: () => void
  onOpenSidebar: () => void
  onNavPlanner: () => void
  onNavDestinations: () => void
  onSearch: () => void
}

export function SiteHeader({
  immersive,
  notHome,
  theme,
  onToggleTheme,
  onHome,
  onOpenSidebar,
  onNavPlanner,
  onNavDestinations,
  onSearch,
}: Props) {
  const [scrolled, setScrolled] = useState(false)

  // Blur the bar in once the hero starts sliding under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Transparent glass only at the very top of the immersive home screen.
  const solid = !immersive || scrolled

  return (
    <motion.header
      className={`${styles.header} ${solid ? styles.solid : styles.floating}`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.inner}>
        <button type="button" className={styles.brand} onClick={onHome} aria-label="TripMora home">
          <Logo />
          <span className={styles.brandName}>
            <b>TripMora</b>
            <span>AI trip planner</span>
          </span>
        </button>

        {immersive && (
          <nav className={styles.nav} aria-label="Primary">
            <button type="button" className={styles.navLink} onClick={onNavDestinations}>
              Destinations
            </button>
            <button type="button" className={styles.navLink} onClick={onNavPlanner}>
              AI Planner
            </button>
            <button type="button" className={styles.navLink} onClick={onOpenSidebar}>
              Saved trips
            </button>
          </nav>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onSearch}
            aria-label="Search a destination"
          >
            <Icon name="map" size={18} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>

          {notHome ? (
            <Button variant="secondary" size="sm" icon="plus" onClick={onHome}>
              New trip
            </Button>
          ) : (
            <Button variant="primary" size="sm" className={styles.cta} onClick={onNavPlanner}>
              Plan a trip
            </Button>
          )}

          <button
            type="button"
            className={`${styles.iconBtn} ${styles.menuBtn}`}
            onClick={onOpenSidebar}
            aria-label="Menu and saved trips"
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
