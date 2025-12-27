import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

/**
 * Check for expiring trials and create notifications
 * Should be called daily (e.g., via cron job or scheduled function)
 */
export async function checkExpiringTrials() {
  const supabase = createClient()

  try {
    // Get all profiles with trialing status
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, trial_ends_at, subscription_status')
      .eq('subscription_status', 'trialing')
      .not('trial_ends_at', 'is', null)

    if (error) {
      console.error('Error fetching trialing profiles:', error)
      throw error
    }

    if (!profiles) return { checked: 0, notified: 0 }

    // Type assertion for the selected columns
    const typedProfiles = profiles as Pick<Profile, 'id' | 'trial_ends_at' | 'subscription_status'>[]

    const now = new Date()
    let notified = 0

    for (const profile of typedProfiles) {
      if (!profile.trial_ends_at) continue

      const trialEndsAt = new Date(profile.trial_ends_at)
      const daysUntilExpiry = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Check if trial expired
      if (trialEndsAt < now) {
        // Check if notification already exists
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('trainer_id', profile.id)
          .eq('type', 'system_update')
          .eq('related_type', 'subscription')
          .ilike('title', '%trial expired%')
          .limit(1)
          .single()

        if (!existingNotification) {
          // Get early adopter count for pricing message
          const { data: eaCount } = await supabase.rpc('get_early_adopter_count')
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_early_adopter')
            .eq('id', profile.id)
            .single()
          
          const typedProfileData = profileData as Pick<Profile, 'is_early_adopter'> | null
          const isEarlyAdopter = typedProfileData?.is_early_adopter || false
          const earlyAdopterCount = eaCount || 0
          
          let pricingMessage = '$29/month'
          if (isEarlyAdopter) {
            pricingMessage = '$19/month (Early Adopter)'
          } else if (earlyAdopterCount < 100) {
            pricingMessage = `$19/month (Early Adopter - ${100 - earlyAdopterCount} spots left) or $29/month`
          }
          
          const notificationData: NotificationInsert = {
            trainer_id: profile.id,
            type: 'system_update',
            title: 'Trial Expired',
            message: `Your free trial has ended. Upgrade to continue using TrainPulse. ${pricingMessage}.`,
            related_type: 'subscription',
            related_id: profile.id, // Use profile ID so we can create link
          }
          await (supabase.from('notifications') as any).insert(notificationData)
          notified++
        }
      }
      // Check if trial expires in 7 days
      else if (daysUntilExpiry === 7) {
        // Check if notification already exists
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('trainer_id', profile.id)
          .eq('type', 'system_update')
          .eq('related_type', 'subscription')
          .ilike('title', '%trial expiring%')
          .limit(1)
          .single()

        if (!existingNotification) {
          // Get early adopter count for pricing message
          const { data: eaCount } = await supabase.rpc('get_early_adopter_count')
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_early_adopter')
            .eq('id', profile.id)
            .single()
          
          const typedProfileData2 = profileData as Pick<Profile, 'is_early_adopter'> | null
          const isEarlyAdopter = typedProfileData2?.is_early_adopter || false
          const earlyAdopterCount = eaCount || 0
          
          let pricingMessage = '$29/month'
          if (isEarlyAdopter) {
            pricingMessage = '$19/month (Early Adopter)'
          } else if (earlyAdopterCount < 100) {
            pricingMessage = `$19/month (Early Adopter - ${100 - earlyAdopterCount} spots left) or $29/month`
          }
          
          const notificationData2: NotificationInsert = {
            trainer_id: profile.id,
            type: 'system_update',
            title: 'Trial Expiring Soon',
            message: `Your free trial ends in 7 days. Upgrade now to continue using TrainPulse. ${pricingMessage}.`,
            related_type: 'subscription',
            related_id: profile.id, // Use profile ID so we can create link
          }
          await (supabase.from('notifications') as any).insert(notificationData2)
          notified++
        }
      }
    }

    return { checked: typedProfiles.length, notified }
  } catch (error) {
    console.error('Failed to check expiring trials:', error)
    throw error
  }
}

