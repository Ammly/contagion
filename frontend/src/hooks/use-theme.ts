'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY  = 'contagion-theme'
const DEFAULT: Theme = 'dark'
/** Custom event fired whenever the theme changes, so all hook instances sync. */
const CHANGE_EVENT = 'contagion:theme-change'

function readStored(): Theme {
  if (typeof window === 'undefined') return DEFAULT
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? DEFAULT
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark',  theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

/**
 * useTheme — returns the current theme and a toggle function.
 *
 * - Defaults to 'dark' if no stored preference.
 * - Persists the selection in localStorage.
 * - Applies 'dark' | 'light' class to <html>.
 * - All hook instances stay in sync via a custom DOM event.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(DEFAULT)

  // Hydrate from localStorage and listen for cross-instance changes
  useEffect(() => {
    const stored = readStored()
    setTheme(stored)
    applyTheme(stored)

    function onExternalChange(e: Event) {
      const next = (e as CustomEvent<Theme>).detail
      setTheme(next)
    }

    window.addEventListener(CHANGE_EVENT, onExternalChange)
    return () => window.removeEventListener(CHANGE_EVENT, onExternalChange)
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = (readStored()) === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    setTheme(next)
    window.dispatchEvent(new CustomEvent<Theme>(CHANGE_EVENT, { detail: next }))
  }, [])

  return { theme, toggleTheme }
}
