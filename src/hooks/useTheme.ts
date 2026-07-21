/** Light/dark theme with a saved preference, defaulting to the OS setting. */
import { useCallback, useEffect, useState } from 'react'
import { loadTheme, saveTheme, type ThemeChoice } from '../lib/storage'

function initialTheme(): ThemeChoice {
  const saved = loadTheme()
  if (saved) return saved
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeChoice>(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
