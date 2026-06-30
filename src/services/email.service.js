import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { resend } from '../config/resend.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const welcomeTemplate = readFileSync(
  join(__dirname, '../emailTemplates/emailTemplate.html'),
  'utf-8'
)

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: env.resend.fromEmail,
    to,
    subject,
    html,
  })

  if (error) {
    throw new AppError('No se pudo enviar el email', 502, error)
  }

  return data
}

export async function sendWelcomeEmail({ to, nombre }) {
  const html = welcomeTemplate.replace('{{NOMBRE}}', nombre)

  console.log("enviando mail a: ", nombre)

  return sendEmail({
    to,
    subject: 'Bienvenido a Club Plaza',
    html,
  })
}
