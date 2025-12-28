# TrainPulse

Personal Trainer Software - Fitness Business Management Platform

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Stripe account (for trainer subscriptions only - not required for MVP)
- Resend account (for email confirmations)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Required for webhooks to bypass RLS
STRIPE_SECRET_KEY=your_stripe_secret_key  # Required for trainer subscriptions
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret  # Required for subscription webhooks (see Webhook Setup below)
RESEND_API_KEY=your_resend_api_key  # Required for appointment confirmation emails
RESEND_FROM_EMAIL=TrainPulse <noreply@yourdomain.com>  # Optional, defaults to TrainPulse <noreply@trainpulse.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For links in emails and redirects
```

**Note:** Stripe is only used for trainer subscriptions (trainers pay to use the platform). Payment processing for clients (Stripe Connect) is not included in the MVP to reduce complexity and friction.

### Stripe Webhook Setup

To enable automatic subscription status updates, you need to configure a webhook in your Stripe Dashboard:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Development**: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhooks`
   - **Production**: `https://your-domain.com/api/stripe/webhooks`
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

**For local development with Stripe CLI:**
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe/webhooks
# Copy the webhook signing secret from the output and add to .env.local
```

### Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## Testing

This project uses a comprehensive testing setup with Jest for unit tests, React Testing Library for component tests, and Playwright for end-to-end tests.

### Running Tests

#### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

#### Run All Tests

```bash
npm run test:all
```

### Test Structure

```
src/
  components/
    __tests__/          # Component unit tests
  lib/
    __tests__/          # Utility function tests
  hooks/
    __tests__/          # Custom hook tests
  app/
    api/
      __tests__/        # API integration tests

e2e/                    # End-to-end tests
  *.spec.ts            # E2E test files
  fixtures.ts          # Playwright fixtures
  utils/               # E2E helper utilities
```

### Test Coverage

We aim for ~80% code coverage on core components and utilities. Run `npm run test:coverage` to see the current coverage report.

### Writing Tests

#### Unit Tests (Jest + React Testing Library)

Example component test:

```typescript
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

#### Integration Tests (API Routes)

Example API test:

```typescript
import { POST } from '@/app/api/my-route/route'
import { NextRequest } from 'next/server'

describe('POST /api/my-route', () => {
  it('should handle requests correctly', async () => {
    const request = new NextRequest('http://localhost/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

#### E2E Tests (Playwright)

Example E2E test:

```typescript
import { test, expect } from '@playwright/test'

test('should complete user flow', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Sign In")')
  // ... test steps
})
```

### Mocking Strategy

- **Supabase**: Mocked in `jest.setup.js` globally
- **Stripe**: Mocked in individual test files
- **Next.js Router**: Mocked in `jest.setup.js`
- **Cookies**: Mocked for server-side tests

### CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/test.yml` for the CI configuration.

## Project Structure

```
src/
  app/              # Next.js app router pages
  components/       # React components
  lib/              # Utility functions
  hooks/            # Custom React hooks
  contexts/         # React contexts
  types/            # TypeScript type definitions

supabase/
  migrations/       # Database migrations

public/             # Static assets

e2e/                # End-to-end tests
```

## License

Private - All rights reserved

