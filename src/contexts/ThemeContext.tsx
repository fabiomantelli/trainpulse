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

  // Helper function to apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // Always ensure theme is applied on mount (handles client-side navigation)
    const syncAndApplyTheme = () => {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      let currentTheme: Theme
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        currentTheme = savedTheme
      } else {
        currentTheme = systemPrefersDark ? 'dark' : 'light'
      }
      
      // Apply theme to document (ensures it works after client-side navigation)
      applyTheme(currentTheme)
      setThemeState(currentTheme)
    }
    
    syncAndApplyTheme()
    
    // Listen for storage changes (e.g., theme changed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme
        if (newTheme === 'light' || newTheme === 'dark') {
          setThemeState(newTheme)
          applyTheme(newTheme)
        }
      }
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      // Only follow system preference if user hasn't set a preference
      if (!savedTheme || (savedTheme !== 'light' && savedTheme !== 'dark')) {
        const newTheme = mediaQuery.matches ? 'dark' : 'light'
        setThemeState(newTheme)
        applyTheme(newTheme)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

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

