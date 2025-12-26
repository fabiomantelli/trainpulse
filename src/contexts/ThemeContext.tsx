'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from script that runs before React hydrates
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light'
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme
      }
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return systemPrefersDark ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  }

  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Sync with the script that already applied the theme
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme)
      // Theme already applied by inline script, just sync state
    } else {
      // Detect system preference (script already applied it, just sync state)
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initialTheme = systemPrefersDark ? 'dark' : 'light'
      setThemeState(initialTheme)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // Prevent flash of wrong theme
  // Always provide the context, but use default theme until mounted
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

