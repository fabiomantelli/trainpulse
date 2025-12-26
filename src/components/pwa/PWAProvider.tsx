'use client'

import { useEffect, useState } from 'react'
import { registerServiceWorker } from '@/lib/pwa/registerSW'

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    registerServiceWorker()

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineBanner(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineBanner(true)
    }

    // Set initial status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Auto-hide offline banner after 5 seconds if connection is restored
    if (isOnline && showOfflineBanner) {
      const timer = setTimeout(() => {
        setShowOfflineBanner(false)
      }, 5000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline, showOfflineBanner])

  return (
    <>
      {children}
      {showOfflineBanner && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            showOfflineBanner ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div
            className={`mx-4 mb-4 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm ${
              isOnline
                ? 'bg-green-500/90 text-white dark:bg-green-600/90'
                : 'bg-orange-500/90 text-white dark:bg-orange-600/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium">Back online! Your data is syncing.</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                      />
                    </svg>
                    <span className="font-medium">
                      You're offline. Viewing cached data.
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowOfflineBanner(false)}
                className="ml-4 rounded p-1 hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

