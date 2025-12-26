'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import { motion } from 'framer-motion'

type Client = Database['public']['Tables']['clients']['Row']

export default function ClientsContent({ trainerId }: { trainerId: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:10',message:'ClientsContent mount',data:{trainerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [trainerId]);
  // #endregion

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    
    const query = searchQuery.toLowerCase()
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.goals?.toLowerCase().includes(query)
    )
  }, [clients, searchQuery])
  
  // #region agent log
  let supabase;
  try {
    supabase = createClient();
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:18',message:'createClient called',data:{hasSupabase:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  } catch (error) {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:20',message:'createClient error',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    throw error;
  }
  const supabaseClient = supabase;
  // #endregion

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:28',message:'useEffect triggered',data:{trainerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    loadClients()
  }, [trainerId])

  async function loadClients() {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:35',message:'loadClients start',data:{trainerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      const { data, error } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false })

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:44',message:'loadClients result',data:{hasError:!!error,errorMessage:error?.message,clientsCount:data?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (error) {
        console.error('Error loading clients:', error)
      } else {
        setClients(data || [])
      }
      setLoading(false)
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:53',message:'loadClients exception',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Unexpected error loading clients:', error)
      setLoading(false)
    }
  }

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsContent.tsx:60',message:'ClientsContent render',data:{loading,clientsCount:clients.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [loading, clients.length]);
  // #endregion

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-slate-300">Loading clients...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5"
      >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent mb-1">
              Clients
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-300">Manage your client relationships</p>
          </div>
          <Link
            href="/clients/new"
            className="group relative px-6 py-3.5 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 whitespace-nowrap overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Client</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </motion.div>

        {/* Search Bar */}
        {clients.length > 0 && (
          <div className="mb-8">
            <div className="relative max-w-2xl">
              <input
                type="text"
                placeholder="Search clients by name, email, phone, or goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3.5 pl-12 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 shadow-sm hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
              />
              <svg
                className="absolute left-4 top-4 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                Showing {filteredClients.length} of {clients.length} clients
              </p>
            )}
          </div>
        )}

        {clients.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No clients yet</h3>
            <p className="text-gray-500 dark:text-slate-300 mb-6">Start building your client base</p>
            <Link
              href="/clients/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Client
            </Link>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No clients found</h3>
            <p className="text-gray-500 dark:text-slate-300 mb-6">Try adjusting your search query</p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link
                  href={`/clients/${client.id}`}
                  className="block bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-4 lg:p-5 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-300 group"
                >
                <div className="flex items-center mb-4">
                  {client.photo_url ? (
                    <img
                      src={client.photo_url}
                      alt={client.name}
                      className="w-16 h-16 rounded-full object-cover mr-4 ring-2 ring-gray-100 group-hover:ring-blue-300 group-hover:scale-110 transition-all duration-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 flex items-center justify-center mr-4 ring-2 ring-gray-100 group-hover:ring-blue-300 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <span className="text-white text-xl font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {client.name}
                    </h3>
                    {client.email && (
                      <p className="text-sm text-gray-500 truncate">{client.email}</p>
                    )}
                  </div>
                </div>
                {client.goals && (
                  <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                    {client.goals}
                  </p>
                )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
    </>
  )
}

