import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
)

export const supabase: SupabaseClient<Database> = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export interface ConnectionCheckResult {
  isConnected: boolean
  message: string
  url?: string
}

export async function checkSupabaseConnection(): Promise<ConnectionCheckResult> {
  if (!isSupabaseConfigured) {
    return {
      isConnected: false,
      message: 'Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    }
  }

  try {
    // Attempt a light ping against auth session or public table
    const { error } = await supabase.auth.getSession()

    if (error) {
      return {
        isConnected: false,
        message: `Auth check failed: ${error.message}`,
        url: supabaseUrl,
      }
    }

    return {
      isConnected: true,
      message: 'Successfully connected to Supabase backend project!',
      url: supabaseUrl,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error'
    return {
      isConnected: false,
      message: `Failed to reach Supabase project: ${errorMsg}`,
      url: supabaseUrl,
    }
  }
}
