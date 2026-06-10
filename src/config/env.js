import 'dotenv/config'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno: ${name}`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    anonKey: requireEnv('SUPABASE_ANON_KEY'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  resend: {
    apiKey: requireEnv('RESEND_API_KEY'),
    fromEmail: requireEnv('RESEND_FROM_EMAIL'),
  },
}
