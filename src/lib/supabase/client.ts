import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { isSupabaseConfigured } from './env'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export { isSupabaseConfigured }

// A placeholder URL/key lets the client construct without throwing when
// unconfigured; `isSupabaseConfigured` gates every real call before it
// would ever reach the network.
export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
