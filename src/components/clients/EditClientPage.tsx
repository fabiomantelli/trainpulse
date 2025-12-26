'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database.types'
import BackButton from '@/components/layout/BackButton'
import toast from 'react-hot-toast'

type Client = Database['public']['Tables']['clients']['Row']

interface EditClientPageProps {
  client: Client
  trainerId: string
}

export default function EditClientPage({ client, trainerId }: EditClientPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(client.name)
  const [email, setEmail] = useState(client.email || '')
  const [phone, setPhone] = useState(client.phone || '')
  const [notes, setNotes] = useState(client.notes || '')
  const [goals, setGoals] = useState(client.goals || '')
  const [medicalNotes, setMedicalNotes] = useState(client.medical_notes || '')
  const [photoUrl, setPhotoUrl] = useState(client.photo_url)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Delete old photo if exists
      if (photoUrl) {
        const oldPath = photoUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('client-photos').remove([oldPath])
        }
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop()
      const fileName = `${client.id}-${Date.now()}.${fileExt}`
      const filePath = `${trainerId}/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('client-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('client-photos').getPublicUrl(filePath)

      setPhotoUrl(publicUrl)
      toast.success('Photo uploaded successfully!')
    } catch (err: any) {
      console.error('Error uploading photo:', err)
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name,
          email: email || null,
          phone: phone || null,
          notes: notes || null,
          goals: goals || null,
          medical_notes: medicalNotes || null,
          photo_url: photoUrl || null,
        })
        .eq('id', client.id)

      if (updateError) throw updateError

      toast.success('Client updated successfully!')
      router.push(`/clients/${client.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update client')
      toast.error('Failed to update client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <BackButton href={`/clients/${client.id}`} />
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Edit Client</h1>
          <p className="text-gray-600">Update client information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={client.name}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-gray-200">
                  <span className="text-white text-xl font-bold">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Remove photo?')) {
                        const oldPath = photoUrl.split('/').pop()
                        if (oldPath) {
                          await supabase.storage.from('client-photos').remove([oldPath])
                        }
                        setPhotoUrl(null)
                        toast.success('Photo removed')
                      }
                    }}
                    className="ml-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="goals"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Goals
              </label>
              <textarea
                id="goals"
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="medicalNotes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Medical Notes
              </label>
              <textarea
                id="medicalNotes"
                rows={3}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="w-full px-4 py-2.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-red-50 transition-all resize-none"
                placeholder="Private health information..."
              />
              <p className="mt-1 text-xs text-gray-500">
                This information is kept private and secure
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

