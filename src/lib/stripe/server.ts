import Stripe from 'stripe'

// #region agent log
const logStripeInit = (location: string, message: string, data: any) => {
  fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
};
logStripeInit('server.ts:3', 'Stripe module loading', {hasStripeKey:!!process.env.STRIPE_SECRET_KEY,keyLength:process.env.STRIPE_SECRET_KEY?.length});
// #endregion

// Initialize Stripe only if key is available (lazy initialization)
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    // #region agent log
    logStripeInit('server.ts:12', 'STRIPE_SECRET_KEY missing in getStripe', {});
    // #endregion
    throw new Error('STRIPE_SECRET_KEY is not set. Please add it to your .env.local file.')
  }

  if (!stripeInstance) {
    // #region agent log
    logStripeInit('server.ts:18', 'Initializing Stripe client', {apiVersion:'2025-12-15.clover'});
    // #endregion
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
    // #region agent log
    logStripeInit('server.ts:24', 'Stripe client initialized', {});
    // #endregion
  }

  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})

/**
 * Create a Stripe Connect account (Express account)
 * @param email Email of the trainer
 * @param country Country code (default: 'US')
 * @returns Account object with account ID
 */
export async function createConnectAccount(
  email: string,
  country: string = 'US'
): Promise<{ accountId: string }> {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    return { accountId: account.id }
  } catch (error: any) {
    // #region agent log
    const logError = (location: string, message: string, data: any) => {
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    };
    logError('server.ts:53', 'Error creating Connect account', {errorMessage:error?.message,errorType:error?.type,errorCode:error?.code});
    // #endregion
    
    // Provide helpful error message for common issues
    if (error?.message?.includes('Connect') || error?.code === 'account_invalid') {
      throw new Error(
        'Stripe Connect is not enabled on your Stripe account. ' +
        'Please enable Stripe Connect in your Stripe Dashboard: https://dashboard.stripe.com/settings/connect ' +
        'or visit https://stripe.com/docs/connect for more information.'
      )
    }
    throw error
  }
}

/**
 * Create an account link for Stripe Connect OAuth flow
 * @param accountId Stripe Connect account ID
 * @param returnUrl URL to return to after OAuth
 * @param refreshUrl URL to refresh the link if expired
 * @param type Type of account link: 'account_onboarding' for new accounts, 'account_update' for existing
 * @returns Account link URL
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
  type: 'account_onboarding' | 'account_update' = 'account_onboarding'
): Promise<string> {
  // #region agent log
  const logLink = (location: string, message: string, data: any) => {
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  };
  logLink('server.ts:95', 'Creating account link', {accountId,returnUrl,refreshUrl,type});
  // #endregion
  
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type,
    })
    // #region agent log
    logLink('server.ts:104', 'Account link created', {url:accountLink.url,expiresAt:accountLink.expires_at});
    // #endregion
    return accountLink.url
  } catch (error: any) {
    // #region agent log
    logLink('server.ts:108', 'Error creating account link', {errorMessage:error?.message,errorType:error?.type});
    // #endregion
    throw error
  }
}

/**
 * Get Stripe Connect account details
 * @param accountId Stripe Connect account ID
 * @returns Account object
 */
export async function getConnectAccount(accountId: string) {
  return await stripe.accounts.retrieve(accountId)
}

/**
 * Check if a Stripe Connect account is fully onboarded
 * @param accountId Stripe Connect account ID
 * @returns Boolean indicating if account is ready
 */
export async function isAccountReady(accountId: string): Promise<boolean> {
  try {
    const account = await stripe.accounts.retrieve(accountId)
    return account.details_submitted && account.charges_enabled
  } catch (error) {
    console.error('Error checking account status:', error)
    return false
  }
}

