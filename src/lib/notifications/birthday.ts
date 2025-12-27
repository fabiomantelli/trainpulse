import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

/**
 * Check for client birthdays and create notifications
 * This should be called daily (e.g., via a cron job or scheduled function)
 */
export async function checkClientBirthdays() {
  const supabase = createClient()

  try {
    // Call the database function to check birthdays
    const { error } = await supabase.rpc('check_client_birthdays')

    if (error) {
      console.error('Error checking client birthdays:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to check client birthdays:', error)
    throw error
  }
}

/**
 * Get upcoming birthdays (within next N days)
 * @param days Number of days to look ahead (default: 7)
 */
export async function getUpcomingBirthdays(trainerId: string, days: number = 7) {
  const supabase = createClient()

  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(today.getDate() + days)

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, date_of_birth')
    .eq('trainer_id', trainerId)
    .not('date_of_birth', 'is', null)
    .order('date_of_birth', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming birthdays:', error)
    return []
  }

  // Type assertion for the selected columns
  const clients = (data || []) as Pick<Client, 'id' | 'name' | 'date_of_birth'>[]

  // Filter clients whose birthday falls within the next N days
  const upcoming = clients
    .map((client) => {
      if (!client.date_of_birth) return null

      const birthDate = new Date(client.date_of_birth)
      const thisYearBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      )
      const nextYearBirthday = new Date(
        today.getFullYear() + 1,
        birthDate.getMonth(),
        birthDate.getDate()
      )

      // Check if birthday is this year or next year within the range
      const daysUntilThisYear =
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      const daysUntilNextYear =
        (nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)

      let daysUntil = daysUntilThisYear >= 0 ? daysUntilThisYear : daysUntilNextYear

      if (daysUntil >= 0 && daysUntil <= days) {
        return {
          ...client,
          daysUntil: Math.ceil(daysUntil),
        }
      }

      return null
    })
    .filter((item) => item !== null)

  return upcoming
}

