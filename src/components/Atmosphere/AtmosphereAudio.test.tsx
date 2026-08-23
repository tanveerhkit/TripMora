import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AtmosphereAudio } from './AtmosphereAudio'

const playMock = vi.fn(() => Promise.resolve())
const pauseMock = vi.fn()
const loadMock = vi.fn()

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pauseMock)
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(loadMock)
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably')
  Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
    configurable: true,
    get: () => 4,
  })
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (callback: FrameRequestCallback) => {
      callback(performance.now() + 1000)
      return 1
    },
  })
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AtmosphereAudio', () => {
  it('is opt-in and renders two hidden audio decks', () => {
    render(<AtmosphereAudio atmosphere="mountain" />)

    const button = screen.getByRole('button', { name: /play alpine air ambience/i })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    const audioDecks = Array.from(document.querySelectorAll('audio'))
    expect(audioDecks).toHaveLength(2)
    expect(audioDecks.every((audio) => audio.getAttribute('preload') === 'none')).toBe(true)
    expect(playMock).not.toHaveBeenCalled()
  })

  it('starts the active deck only after the user enables ambience', async () => {
    render(<AtmosphereAudio atmosphere="mountain" />)

    fireEvent.click(screen.getByRole('button', { name: /play alpine air ambience/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /mute alpine air ambience/i }).getAttribute('aria-pressed')).toBe('true'))
    expect(playMock).toHaveBeenCalled()
    expect(loadMock).toHaveBeenCalled()
    expect(Array.from(document.querySelectorAll('audio')).some((audio) => audio.src.includes('/audio/mountain-ambient.ogg'))).toBe(true)
  })

  it('prepares the next destination deck when the theme changes while enabled', async () => {
    const view = render(<AtmosphereAudio atmosphere="mountain" />)
    fireEvent.click(screen.getByRole('button', { name: /play alpine air ambience/i }))
    await waitFor(() => expect(playMock).toHaveBeenCalled())
    const callsBeforeSwitch = playMock.mock.calls.length

    view.rerender(<AtmosphereAudio atmosphere="tropical" />)

    await waitFor(() => expect(Array.from(document.querySelectorAll('audio')).some((audio) => audio.src.includes('/audio/tropical-ambient.ogg'))).toBe(true))
    expect(playMock.mock.calls.length).toBeGreaterThan(callsBeforeSwitch)
    expect(screen.getByRole('button', { name: /mute tidal warmth ambience/i }).getAttribute('aria-pressed')).toBe('true')
  })
})
