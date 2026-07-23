import { useCallback, useEffect, useState } from 'react'
import { useItinerary } from './hooks/useItinerary'
import { useDream } from './hooks/useDream'
import { useSessions } from './hooks/useSessions'
import { useTheme } from './hooks/useTheme'
import { relativeTime } from './lib/format'
import { countStops } from './lib/itineraryOps'
import { destinationToPrompt } from './lib/dreamPrompt'
import type { StoredSession } from './lib/storage'
import type { DestinationRec, DreamAnswers } from './types/dream'
import { Button } from './components/ui/Button'
import { Icon } from './components/ui/Icon'
import { Logo } from './components/ui/Logo'
import { ModeChooser, type HomeMode } from './components/Home/ModeChooser'
import { TripForm } from './components/TripForm/TripForm'
import { DreamForm } from './components/Dream/DreamForm'
import { DreamResults } from './components/Dream/DreamResults'
import { LoadingItinerary } from './components/states/LoadingItinerary'
import { LoadingDream } from './components/states/LoadingDream'
import { ErrorState } from './components/states/ErrorState'
import { ItineraryView } from './components/Itinerary/ItineraryView'
import { SessionSidebar } from './components/Sessions/SessionSidebar'
import styles from './App.module.css'

type Screen = 'home' | 'describe' | 'dream'

export default function App() {
  const itin = useItinerary()
  const dream = useDream()
  const { sessions, upsert, remove } = useSessions()
  const { theme, toggle } = useTheme()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [basePrompt, setBasePrompt] = useState('')
  const [screen, setScreen] = useState<Screen>('home')
  const [dreamAnswers, setDreamAnswers] = useState<DreamAnswers | null>(null)

  // Autosave the current itinerary whenever it changes.
  useEffect(() => {
    if (itin.status === 'ready' && itin.itinerary) {
      upsert(basePrompt, itin.itinerary)
    }
  }, [itin.itinerary, itin.status, basePrompt, upsert])

  const handleGenerate = useCallback(
    (prompt: string) => {
      setBasePrompt(prompt)
      setSidebarOpen(false)
      dream.reset()
      itin.generate(prompt)
    },
    [itin, dream],
  )

  const handleDreamSubmit = useCallback(
    (answers: DreamAnswers) => {
      setDreamAnswers(answers)
      dream.dream(answers)
    },
    [dream],
  )

  const handlePlanDestination = useCallback(
    (dest: DestinationRec) => {
      const prompt = destinationToPrompt(dest, dreamAnswers)
      setBasePrompt(prompt)
      setSidebarOpen(false)
      dream.reset()
      itin.generate(prompt)
    },
    [itin, dream, dreamAnswers],
  )

  const handleSelectSession = useCallback(
    (session: StoredSession) => {
      setBasePrompt(session.prompt)
      dream.reset()
      itin.setItinerary(session.itinerary)
      setScreen('describe')
      setSidebarOpen(false)
    },
    [itin, dream],
  )

  const handleNewTrip = useCallback(() => {
    itin.reset()
    dream.reset()
    setBasePrompt('')
    setDreamAnswers(null)
    setScreen('home')
    setSidebarOpen(false)
  }, [itin, dream])

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
  const isRecovering = itin.isLoading && itin.loadingMode === 'recover'
  const itinErrorNoItin = itin.status === 'error' && !hasItinerary
  const itineraryActive = hasItinerary || isGenerating || itinErrorNoItin
  const notHome = itineraryActive || screen !== 'home'
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
          <button
            type="button"
            className={styles.brand}
            onClick={handleNewTrip}
            aria-label="TripMora home"
          >
            <Logo />
            <span className={styles.brandName}>
              <b>TripMora</b> <span>· AI trip planner</span>
            </span>
          </button>
          <div className={styles.headerActions}>
            {notHome && (
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
        {itineraryActive ? (
          <>
            {isGenerating && <LoadingItinerary mode="generate" />}

            {itinErrorNoItin && itin.error && (
              <ErrorState error={itin.error} onRetry={itin.retry} onStartOver={handleNewTrip} />
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
                  onRecover={itin.recover}
                  refining={isRefining}
                  recovering={isRecovering}
                />
              </>
            )}
          </>
        ) : screen === 'dream' ? (
          dream.isLoading ? (
            <LoadingDream />
          ) : dream.status === 'error' && dream.error ? (
            <ErrorState error={dream.error} onRetry={dream.retry} onStartOver={handleNewTrip} />
          ) : dream.result ? (
            <DreamResults
              result={dream.result}
              onPlan={handlePlanDestination}
              onAdjust={dream.reset}
              onSeeMore={dream.dreamMore}
              loadingMore={dream.loadingMore}
              moreError={dream.moreError}
            />
          ) : (
            <DreamForm
              onSubmit={handleDreamSubmit}
              onBack={() => setScreen('home')}
              loading={dream.isLoading}
              initialAnswers={dreamAnswers}
            />
          )
        ) : screen === 'describe' ? (
          <section className={styles.hero}>
            <Button
              variant="ghost"
              size="sm"
              icon="chevron"
              className={styles.backBtn}
              onClick={() => setScreen('home')}
            >
              Back
            </Button>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>Describe your trip</h1>
              <p className={styles.heroSub}>
                Tell me where you&apos;re going and what you like. I&apos;ll draft an editable
                day-by-day itinerary.
              </p>
            </div>
            <TripForm onSubmit={handleGenerate} loading={isGenerating} />
          </section>
        ) : (
          <section className={`${styles.hero} ${styles.homeWide}`}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>
                Your next trip <b>starts here</b>
              </h1>
              <p className={styles.heroSub}>
                Get matched with a destination, or describe a place you already love —
                TripMora plans the rest.
              </p>
            </div>

            <ModeChooser onChoose={(m: HomeMode) => setScreen(m)} />

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
                      <span className={styles.recentTitle}>{s.itinerary.meta.destination}</span>
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
      </main>

      <footer className={styles.footer}>
        Built with React + Gemini · your trips are saved in this browser only
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
