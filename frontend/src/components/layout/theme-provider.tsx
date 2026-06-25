'use client'

import { useTheme } from '@/hooks/use-theme'

/**
 * Mounts the theme hook so the initial theme is applied to <html>
 * on the client side, complementing the inline FOUT-prevention script
 * in layout.tsx.  Renders nothing visible.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Calling the hook here ensures the stored theme is applied on first
  // client render and that the class stays in sync with localStorage.
  useTheme()
  return <>{children}</>
}
