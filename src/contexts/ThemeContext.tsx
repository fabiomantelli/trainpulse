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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:15',message:'ThemeProvider render start',data:{hasWindow:typeof window !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:19',message:'ThemeProvider state initialized',data:{theme,mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:23',message:'ThemeProvider useEffect triggered',data:{hasWindow:typeof window !== 'undefined',hasLocalStorage:typeof window !== 'undefined' && typeof localStorage !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setMounted(true)
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme | null
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:27',message:'ThemeProvider localStorage check',data:{savedTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Detect system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initialTheme = systemPrefersDark ? 'dark' : 'light'
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:34',message:'ThemeProvider system preference detected',data:{systemPrefersDark,initialTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setThemeState(initialTheme)
      applyTheme(initialTheme)
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

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:58',message:'ThemeProvider render decision',data:{mounted,willReturnProvider:!!mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Prevent flash of wrong theme
  // Always provide the context, but use default theme until mounted
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:67',message:'useTheme called',data:{hasWindow:typeof window !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const context = useContext(ThemeContext)
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:70',message:'useTheme context check',data:{contextIsUndefined:context === undefined,hasContext:!!context},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  if (context === undefined) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeContext.tsx:72',message:'useTheme throwing error',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

