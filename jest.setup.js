// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      route: '/',
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react')
  
  const createMockComponent = (tag) => {
    const MockComponent = React.forwardRef((props, ref) => {
      // Filter out framer-motion specific props
      const { 
        children, 
        whileHover, 
        whileTap, 
        whileFocus, 
        whileInView, 
        animate, 
        initial, 
        exit, 
        transition, 
        variants, 
        layout, 
        layoutId, 
        drag, 
        dragConstraints, 
        onDrag, 
        onDragStart, 
        onDragEnd,
        ...restProps 
      } = props || {}
      
      return React.createElement(tag, { ...restProps, ref }, children)
    })
    MockComponent.displayName = `motion.${tag}`
    return MockComponent
  }
  
  // Create all common motion components
  const motionComponents = ['button', 'div', 'span', 'a', 'form', 'input', 'textarea', 'select', 'option', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'nav', 'section', 'article', 'header', 'footer', 'main', 'aside', 'img', 'svg', 'path']
  const motion = {}
  
  motionComponents.forEach(tag => {
    motion[tag] = createMockComponent(tag)
  })
  
  return {
    motion,
    AnimatePresence: ({ children }) => children,
  }
})

// Mock Supabase client
const createMockQueryBuilder = () => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
  return builder
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: null },
        unsubscribe: jest.fn(),
      })),
    },
    from: jest.fn(() => createMockQueryBuilder()),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    rpc: jest.fn(),
  })),
}))

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => createMockQueryBuilder()),
    rpc: jest.fn(),
  })),
}))

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
})

// Mock Next.js server globals for API route tests
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input?.url || ''
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this.body = init?.body
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this._body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers)
    }
    json() {
      const bodyStr = typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
      try {
        return Promise.resolve(JSON.parse(bodyStr))
      } catch {
        return Promise.resolve(this._body)
      }
    }
    text() {
      return Promise.resolve(typeof this._body === 'string' ? this._body : JSON.stringify(this._body))
    }
    static json(body, init) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      })
    }
  }
}

// Polyfill fetch for Jest (for debug logging)
const fs = require('fs')
const path = require('path')

if (typeof global.fetch === 'undefined') {
  global.fetch = async (url, options) => {
    // Only handle debug log endpoint
    if (url && url.includes('/ingest/')) {
      try {
        const logPath = path.join(process.cwd(), '.cursor', 'debug.log')
        const logDir = path.dirname(logPath)
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true })
        }
        const body = JSON.parse(options?.body || '{}')
        const logLine = JSON.stringify(body) + '\n'
        fs.appendFileSync(logPath, logLine, 'utf8')
        return { ok: true, status: 200 }
      } catch (err) {
        // Silently fail in tests
        return { ok: false, status: 500 }
      }
    }
    // Fallback for other fetch calls
    throw new Error('fetch not implemented')
  }
}

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_test'

// Suppress console errors in tests (optional, can be removed if you want to see errors)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: An invalid form control') ||
        (args[0].includes('Warning: An update to') && args[0].includes('was not wrapped in act')))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

jest.mock('next/server', () => {
  class NextResponse extends Response {
    constructor(body, init) {
      super(body, init)
    }
    static json(body, init) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      })
    }
  }
  
  return {
    NextRequest: class NextRequest extends Request {
      constructor(input, init) {
        super(input, init)
      }
    },
    NextResponse,
  }
})

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
