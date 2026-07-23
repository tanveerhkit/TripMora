import { beforeEach, vi } from 'vitest'

// jsdom has no matchMedia; framer-motion and our reduced-motion checks call it.
// Provide a stub that reports "no match" (light, motion allowed) so components
// relying on it render without throwing.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// Keep tests offline: stub fetch so components that look up location images
// (Wikipedia) resolve to "no image" instead of making real network calls.
// Re-applied before each test so it survives mock restoration.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    })),
  )
})
