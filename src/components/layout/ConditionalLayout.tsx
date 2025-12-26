'use client'

import { ReactNode, useEffect, useState, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import AppLayout from './AppLayout'
import PWAProvider from '@/components/pwa/PWAProvider'

export default function ConditionalLayout({ 
  children,
  initialPathname 
}: { 
  children: ReactNode
  initialPathname?: string
}) {
  const pathname = usePathname()
  
  // Use pathname from Next.js router, fallback to window location for client-side navigation
  // Don't rely on initialPathname from server after client-side navigation
  const getEffectivePathname = () => {
    // Always prefer client-side pathname when available (for client-side navigation after login)
    if (typeof window !== 'undefined' && pathname) return pathname
    if (pathname) return pathname
    if (typeof window !== 'undefined') return window.location.pathname
    if (initialPathname) return initialPathname
    return '/'
  }
  
  const effectivePathname = getEffectivePathname()
  
  // Initialize state - use effectivePathname (prioritizes client-side pathname)
  const [shouldSkipLayout, setShouldSkipLayout] = useState(() => {
    // Skip layout for auth pages and home page
    const initialCheck = effectivePathname.startsWith('/auth') || effectivePathname === '/'
    return initialCheck
  })
  const [mounted, setMounted] = useState(false)

  // Use useLayoutEffect to check pathname synchronously before paint
  useLayoutEffect(() => {
    const currentPath = getEffectivePathname()
    const skipLayout = currentPath.startsWith('/auth') || currentPath === '/'
    setShouldSkipLayout(skipLayout)
    setMounted(true)
  }, [pathname])

  // Check pathname whenever it changes
  useEffect(() => {
    if (!mounted) return
    
    const currentPath = getEffectivePathname()
    const skipLayout = currentPath.startsWith('/auth') || currentPath === '/'
    setShouldSkipLayout(skipLayout)
  }, [pathname, mounted])

  if (shouldSkipLayout) {
    return <PWAProvider>{children}</PWAProvider>
  }

  return (
    <PWAProvider>
      <AppLayout>{children}</AppLayout>
    </PWAProvider>
  )
}

