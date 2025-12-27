import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createConnectAccount, createAccountLink } from '@/lib/stripe/server'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function POST(request: NextRequest) {
  // #region agent log
  const logData = (location: string, message: string, data: any, hypothesisId: string) => {
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId})}).catch(()=>{});
  };
  logData('route.ts:5', 'POST /api/stripe/connect called', {}, 'A');
  // #endregion
  
  // Check for Stripe key early and return helpful error
  if (!process.env.STRIPE_SECRET_KEY) {
    // #region agent log
    logData('route.ts:9', 'STRIPE_SECRET_KEY missing, returning error', {}, 'A');
    // #endregion
    return NextResponse.json(
      { 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env.local file.' 
      },
      { status: 500 }
    )
  }

  try {
    // #region agent log
    logData('route.ts:18', 'Before createServerClient', {hasStripeKey:!!process.env.STRIPE_SECRET_KEY}, 'A');
    // #endregion
    const supabase = await createServerClient()
    // #region agent log
    logData('route.ts:11', 'After createServerClient', {}, 'C');
    // #endregion
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    // #region agent log
    logData('route.ts:19', 'After getUser', {hasUser:!!user,hasAuthError:!!authError,authError:authError?.message}, 'C');
    // #endregion

    if (authError || !user) {
      // #region agent log
      logData('route.ts:22', 'Auth failed, returning 401', {authError:authError?.message}, 'C');
      // #endregion
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    const typedProfile = profile as Profile | null
    // #region agent log
    logData('route.ts:30', 'After profile query', {hasProfile:!!typedProfile,hasProfileError:!!profileError,profileError:profileError?.message,hasStripeAccountId:!!typedProfile?.stripe_account_id,profileState:typedProfile?.state,profileCity:typedProfile?.city,profileZipCode:typedProfile?.zip_code}, 'A');
    // #endregion

    if (profileError || !typedProfile) {
      // #region agent log
      logData('route.ts:34', 'Profile not found, returning 404', {profileError:profileError?.message}, 'A');
      // #endregion
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if user already has a Stripe account
    if (typedProfile.stripe_account_id) {
      // #region agent log
      logData('route.ts:78', 'User has existing Stripe account, creating update link', {accountId:typedProfile.stripe_account_id}, 'A');
      // #endregion
      // Create account link for existing account (update mode)
      const returnUrl = `${request.nextUrl.origin}/api/stripe/connect/callback`
      const refreshUrl = `${request.nextUrl.origin}/api/stripe/connect/callback?refresh=true`
      
      const accountLinkUrl = await createAccountLink(
        typedProfile.stripe_account_id,
        returnUrl,
        refreshUrl,
        'account_update' // Use update mode for existing accounts
      )
      // #region agent log
      logData('route.ts:88', 'Account link created for existing account', {url:accountLinkUrl}, 'A');
      // #endregion
      return NextResponse.json({ url: accountLinkUrl })
    }

    // Check if user has location data (required for Stripe)
    // #region agent log
    logData('route.ts:54', 'Checking location data', {state:typedProfile.state,city:typedProfile.city,zip_code:typedProfile.zip_code,hasState:!!typedProfile.state,hasCity:!!typedProfile.city,hasZipCode:!!typedProfile.zip_code}, 'A');
    // #endregion
    if (!typedProfile.state || !typedProfile.city || !typedProfile.zip_code) {
      // #region agent log
      logData('route.ts:57', 'Location validation failed', {state:typedProfile.state,city:typedProfile.city,zip_code:typedProfile.zip_code}, 'A');
      // #endregion
      return NextResponse.json(
        { error: 'Please complete your location information before connecting Stripe' },
        { status: 400 }
      )
    }

    // Create new Stripe Connect account
    // #region agent log
    logData('route.ts:62', 'Before createConnectAccount', {email:user.email}, 'D');
    // #endregion
    let accountId: string
    try {
      const result = await createConnectAccount(
        user.email || '',
        'US'
      )
      accountId = result.accountId
      // #region agent log
      logData('route.ts:70', 'After createConnectAccount', {accountId}, 'D');
      // #endregion
    } catch (error: any) {
      // #region agent log
      logData('route.ts:74', 'Error in createConnectAccount', {errorMessage:error?.message}, 'D');
      // #endregion
      return NextResponse.json(
        { error: error.message || 'Failed to create Stripe Connect account' },
        { status: 400 }
      )
    }

    // Save account ID to profile
    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update({ stripe_account_id: accountId })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save Stripe account' },
        { status: 500 }
      )
    }

    // Create account link for onboarding
    const returnUrl = `${request.nextUrl.origin}/api/stripe/connect/callback`
    const refreshUrl = `${request.nextUrl.origin}/api/stripe/connect/callback?refresh=true`
    
    // #region agent log
    logData('route.ts:110', 'Creating onboarding account link', {accountId,returnUrl,refreshUrl}, 'A');
    // #endregion
    const accountLinkUrl = await createAccountLink(
      accountId,
      returnUrl,
      refreshUrl,
      'account_onboarding' // Use onboarding mode for new accounts
    )
    // #region agent log
    logData('route.ts:118', 'Account link created for new account', {url:accountLinkUrl}, 'A');
    // #endregion

    return NextResponse.json({ url: accountLinkUrl })
  } catch (error: any) {
    // #region agent log
    logData('route.ts:95', 'Error caught in POST handler', {errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,300)}, 'B');
    // #endregion
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

