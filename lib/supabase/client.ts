import {createClient as createSupabaseClient} from '@supabase/supabase-js'

export const createClient = () => createSupabaseClient(import.meta.env.VITE_PUBLIC_SUPABASE_URL!, import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!)
