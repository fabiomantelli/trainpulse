'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/layout/BackButton'

export default function NewClientForm({ trainerId }: { trainerId: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [goals, setGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('clients').insert({
      trainer_id: trainerId,
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      goals: goals || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/clients')
      router.refresh()
    }
  }

  return (
    <>
      <BackButton href="/clients" />
      <div className="max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">Add New Client</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">Create a new client profile</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-5 lg:p-6">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 transition-all"
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 transition-all"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label
                htmlFor="goals"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
              >
                Goals
              </label>
              <textarea
                id="goals"
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 transition-all resize-none"
                placeholder="Client fitness goals..."
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
              >
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 transition-all resize-none"
                placeholder="Additional notes about the client..."
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

