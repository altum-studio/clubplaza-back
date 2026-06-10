import { resend } from '../config/resend.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

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
  return sendEmail({
    to,
    subject: 'Bienvenido a Club Plaza',
    html: `
      <h1>Hola ${nombre}!</h1>
      <p>Tu cuenta en Club Plaza fue creada correctamente.</p>
      <p>Ya podés empezar a descubrir promos y beneficios en el shopping.</p>
    `,
  })
}

export async function sendPromoNotificationEmail({ to, titulo, localNombre }) {
  return sendEmail({
    to,
    subject: `Nueva promo: ${titulo}`,
    html: `
      <h1>Nueva promo disponible</h1>
      <p><strong>${titulo}</strong> en ${localNombre}.</p>
      <p>Ingresá a la app para ver el detalle.</p>
    `,
  })
}
