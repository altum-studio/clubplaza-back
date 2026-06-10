import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { env } from './env.js'

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
}

export const supabaseAuth = createClient(env.supabase.url, env.supabase.anonKey, clientOptions)
export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, clientOptions)
