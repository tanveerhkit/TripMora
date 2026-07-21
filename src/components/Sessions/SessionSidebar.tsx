import { useEffect } from 'react'
import { relativeTime } from '../../lib/format'
import { countStops } from '../../lib/itineraryOps'
import type { StoredSession } from '../../lib/storage'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './SessionSidebar.module.css'

interface Props {
  open: boolean
  sessions: StoredSession[]
  currentId: string | null
  onClose: () => void
  onSelect: (session: StoredSession) => void
  onDelete: (id: string) => void
  onNew: () => void
}

export function SessionSidebar({
  open,
  sessions,
  currentId,
  onClose,
  onSelect,
  onDelete,
  onNew,
}: Props) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-label="Saved trips"
        aria-hidden={!open}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>
            <Icon name="map" size={18} /> Saved trips
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon="close"
            iconOnly
            aria-label="Close saved trips"
            onClick={onClose}
          />
        </header>

        <div className={styles.newWrap}>
          <Button variant="primary" size="md" icon="plus" onClick={onNew} className={styles.newBtn}>
            New trip
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className={styles.empty}>
            <Icon name="suitcase" size={26} />
            <p>Your planned trips are saved here automatically.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {sessions.map((s) => (
              <li key={s.id}>
                <div
                  className={`${styles.item} ${s.id === currentId ? styles.active : ''}`}
                >
                  <button
                    type="button"
                    className={styles.itemMain}
                    onClick={() => onSelect(s)}
                  >
                    <span className={styles.itemTitle}>{s.itinerary.meta.destination}</span>
                    <span className={styles.itemMeta}>
                      {s.itinerary.days.length}d · {countStops(s.itinerary)} stops ·{' '}
                      {relativeTime(s.updatedAt)}
                    </span>
                    {s.prompt && <span className={styles.itemPrompt}>{s.prompt}</span>}
                  </button>
                  <button
                    type="button"
                    className={styles.del}
                    aria-label={`Delete ${s.itinerary.meta.destination}`}
                    onClick={() => onDelete(s.id)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </>
  )
}
