import { useCallback, useEffect, useState } from 'react'
import { useItinerary } from './hooks/useItinerary'
import { useSessions } from './hooks/useSessions'
import { useTheme } from './hooks/useTheme'
import { relativeTime } from './lib/format'
import { countStops } from './lib/itineraryOps'
import type { StoredSession } from './lib/storage'
import { Button } from './components/ui/Button'
import { Icon } from './components/ui/Icon'
import { TripForm } from './components/TripForm/TripForm'
import { LoadingItinerary } from './components/states/LoadingItinerary'
import { ErrorState } from './components/states/ErrorState'
import { ItineraryView } from './components/Itinerary/ItineraryView'
import { SessionSidebar } from './components/Sessions/SessionSidebar'
import styles from './App.module.css'

export default function App() {
  const itin = useItinerary()
  const { sessions, upsert, remove } = useSessions()
  const { theme, toggle } = useTheme()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [basePrompt, setBasePrompt] = useState('')

  // Autosave: whenever the current itinerary changes, persist its session.
  useEffect(() => {
    if (itin.status === 'ready' && itin.itinerary) {
      upsert(basePrompt, itin.itinerary)
    }
  }, [itin.itinerary, itin.status, basePrompt, upsert])

  const handleGenerate = useCallback(
    (prompt: string) => {
      setBasePrompt(prompt)
      setSidebarOpen(false)
      itin.generate(prompt)
    },
    [itin],
  )

  const handleSelectSession = useCallback(
    (session: StoredSession) => {
      setBasePrompt(session.prompt)
      itin.setItinerary(session.itinerary)
      setSidebarOpen(false)
    },
    [itin],
  )

  const handleNewTrip = useCallback(() => {
    itin.reset()
    setBasePrompt('')
    setSidebarOpen(false)
  }, [itin])

  const handleDeleteSession = useCallback(
    (id: string) => {
      remove(id)
      if (itin.itinerary?.id === id) {
        itin.reset()
        setBasePrompt('')
      }
    },
    [itin, remove],
  )

  const hasItinerary = Boolean(itin.itinerary)
  const isGenerating = itin.isLoading && itin.loadingMode === 'generate'
  const isRefining = itin.isLoading && itin.loadingMode === 'refine'
  const showForm = !hasItinerary && !itin.isLoading && itin.status !== 'error'
  const recent = sessions.slice(0, 3)

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Button
            variant="ghost"
            size="sm"
            icon="menu"
            iconOnly
            aria-label="Saved trips"
            onClick={() => setSidebarOpen(true)}
          />
          <div className={styles.brand}>
            <span className={styles.logo}>
              <Icon name="compass" size={18} />
            </span>
            <span className={styles.brandName}>
              <b>TripMora</b> <span>· AI trip planner</span>
            </span>
          </div>
          <div className={styles.headerActions}>
            {hasItinerary && (
              <Button variant="secondary" size="sm" icon="plus" onClick={handleNewTrip}>
                New trip
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={theme === 'dark' ? 'sun' : 'moon'}
              iconOnly
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggle}
            />
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {showForm && (
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>
                Turn an idea into a <b>day-by-day plan</b>
              </h1>
              <p className={styles.heroSub}>
                Describe your trip in your own words. TripMora drafts a structured
                itinerary you can expand, edit, reorder and refine.
              </p>
            </div>

            <TripForm onSubmit={handleGenerate} loading={isGenerating} />

            {recent.length > 0 && (
              <div className={styles.recent}>
                <span className={styles.recentLabel}>Recent trips</span>
                <div className={styles.recentGrid}>
                  {recent.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={styles.recentCard}
                      onClick={() => handleSelectSession(s)}
                    >
                      <span className={styles.recentTitle}>
                        {s.itinerary.meta.destination}
                      </span>
                      <span className={styles.recentMeta}>
                        {s.itinerary.days.length}d · {countStops(s.itinerary)} stops ·{' '}
                        {relativeTime(s.updatedAt)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {isGenerating && <LoadingItinerary mode="generate" />}

        {itin.status === 'error' && !hasItinerary && itin.error && (
          <ErrorState
            error={itin.error}
            onRetry={itin.retry}
            onStartOver={handleNewTrip}
          />
        )}

        {hasItinerary && !isGenerating && itin.itinerary && (
          <>
            {itin.status === 'error' && itin.error && (
              <div className={styles.banner} role="alert">
                <Icon name="warning" size={20} />
                <span className={styles.bannerText}>{itin.error.message}</span>
                <Button variant="secondary" size="sm" icon="retry" onClick={itin.retry}>
                  Retry
                </Button>
              </div>
            )}
            <ItineraryView
              itinerary={itin.itinerary}
              mutate={itin.mutate}
              onRefine={itin.refine}
              refining={isRefining}
            />
          </>
        )}
      </main>

      <footer className={styles.footer}>
        Built with React + Groq · your trips are saved in this browser only
      </footer>

      <SessionSidebar
        open={sidebarOpen}
        sessions={sessions}
        currentId={itin.itinerary?.id ?? null}
        onClose={() => setSidebarOpen(false)}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        onNew={handleNewTrip}
      />
    </div>
  )
}
