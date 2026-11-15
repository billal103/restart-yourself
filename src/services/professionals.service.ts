import { supabase } from '@/lib/supabase/client'

export const professionalsService = {
  async list() {
    const { data, error } = await supabase.from('professionals').select('*')
    if (error) throw error
    return data
  },

  async apply(userId: string, input: { name: string; title: string; bio?: string; specializations: string[] }) {
    const { error } = await supabase.from('professionals').insert({ user_id: userId, ...input })
    if (error) throw error
  },

  async listResources() {
    const { data, error } = await supabase.from('resources').select('*')
    if (error) throw error
    return data
  },
}
