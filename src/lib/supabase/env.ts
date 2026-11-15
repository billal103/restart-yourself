// Deliberately has zero imports. Checking whether Supabase is configured
// must never pull the (large) @supabase/supabase-js client into a bundle
// that loads for every visitor — most of whom, in mock mode, don't need it
// at all. src/lib/supabase/client.ts imports this; nothing else should
// import the client directly from an eagerly-loaded module (see authStore).
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)
