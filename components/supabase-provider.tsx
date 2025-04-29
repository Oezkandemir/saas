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

    // Get initial session using getUser() instead of getSession()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session)
        })
      }
    })

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