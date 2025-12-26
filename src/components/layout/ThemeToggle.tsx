'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:6',message:'ThemeToggle render start',data:{hasWindow:typeof window !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  let themeContext;
  try {
    themeContext = useTheme();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:12',message:'ThemeToggle useTheme success',data:{hasContext:!!themeContext,theme:themeContext?.theme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:16',message:'ThemeToggle useTheme error',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw error;
  }
  const { theme, toggleTheme } = themeContext;

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <motion.svg
          className="w-5 h-5 text-gray-700 dark:text-slate-200 absolute inset-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          initial={false}
          animate={{
            opacity: theme === 'light' ? 1 : 0,
            rotate: theme === 'light' ? 0 : 180,
            scale: theme === 'light' ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </motion.svg>
        <motion.svg
          className="w-5 h-5 text-gray-700 dark:text-slate-200 absolute inset-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          initial={false}
          animate={{
            opacity: theme === 'dark' ? 1 : 0,
            rotate: theme === 'dark' ? 0 : -180,
            scale: theme === 'dark' ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </motion.svg>
      </div>
    </button>
  )
}

