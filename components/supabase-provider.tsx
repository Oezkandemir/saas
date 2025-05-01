"use client";

import { createContext, useContext, useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/lib/supabase'
import { type Session } from '@supabase/supabase-js'

type SupabaseContextType = {
  supabase: ReturnType<typeof createBrowserClient<Database>>
  session: Session | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => 
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    async function loadInitialSession() {
      try {
        const { data: userData } = await supabase.auth.getUser()
        
        if (userData.user) {
          const { data: sessionData } = await supabase.auth.getSession()
          setSession(sessionData.session)
        }
      } catch (error) {
        console.error('Error loading initial session:', error)
      }
      }
    
    loadInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
} 