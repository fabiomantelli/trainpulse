// TrainPulse Service Worker
// Version 1.0.0

const CACHE_VERSION = 'trainpulse-v1.0.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DATA_CACHE = `${CACHE_VERSION}-data`
const PAGES_CACHE = `${CACHE_VERSION}-pages`

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err)
      })
    })
  )
  self.skipWaiting() // Activate immediately
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete caches that don't match current version
            return (
              cacheName.startsWith('trainpulse-') &&
              !cacheName.includes(CACHE_VERSION)
            )
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim() // Take control of all pages
})

// Fetch event - intercept network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    // Cache first for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isSupabaseRequest(request)) {
    // Network first with cache fallback for Supabase API requests
    event.respondWith(networkFirstWithCache(request, DATA_CACHE))
  } else if (isPageRequest(request)) {
    // Stale while revalidate for pages
    event.respondWith(staleWhileRevalidate(request, PAGES_CACHE))
  } else {
    // Network first for other requests
    event.respondWith(networkFirst(request))
  }
})

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url)
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'
  )
}

function isSupabaseRequest(request) {
  const url = new URL(request.url)
  return (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.io') ||
    url.pathname.includes('/api/') ||
    url.searchParams.has('trainer_id')
  )
}

function isPageRequest(request) {
  const url = new URL(request.url)
  const acceptHeader = request.headers.get('accept')
  return (
    acceptHeader &&
    acceptHeader.includes('text/html') &&
    url.origin === self.location.origin
  )
}

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Cache first failed:', error)
    throw error
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error)
    const cache = await caches.match(request)
    if (cache) {
      return cache
    }
    throw error
  }
}

async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      // Only cache successful responses
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', error)
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No internet connection' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  })

  // Return cached version immediately, update in background
  return cached || fetchPromise
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'TrainPulse'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'default',
    data: data.url || '/',
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

