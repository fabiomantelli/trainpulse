'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Platform = 'ios' | 'android' | 'desktop' | 'unknown'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Detect if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatform('ios')
    } else if (/android/i.test(userAgent)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    // Check if user has dismissed the prompt before (using localStorage)
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt if not dismissed in last 24 hours
      if (!dismissed || dismissedTime < oneDayAgo) {
        setTimeout(() => setShowPrompt(true), 2000) // Show after 2 seconds
      }
    }

    // Show manual prompt for iOS/Safari after delay if not dismissed
    if (platform === 'ios' && (!dismissed || dismissedTime < oneDayAgo)) {
      setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds for iOS
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [platform])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Use native prompt for Chrome/Edge
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowPrompt(false)
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (platform === 'ios') {
      // Show instructions for iOS
      setShowInstructions(true)
    } else if (platform === 'android') {
      // Show instructions for Android
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed
  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto md:left-auto md:right-4"
        >
          {!showInstructions ? (
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">TP</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-1">
                    Install TrainPulse
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Install the app for quick access and offline use
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstall}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                      {platform === 'ios' || platform === 'android' ? 'How to install' : 'Install now'}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-slate-400"
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
          ) : (
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 p-5">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Back"
                >
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-3">
                    {platform === 'ios' ? 'Install on iOS' : 'Install on Android'}
                  </h3>
                  {platform === 'ios' ? (
                    <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <p>Tap the <strong>Share</strong> button <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg> in the bottom bar</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          3
                        </span>
                        <p>Tap <strong>"Add"</strong> to confirm</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <p>Tap the menu icon <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg> in your browser</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <p>Look for <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          3
                        </span>
                        <p>Tap to install and the app will appear on your home screen</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}