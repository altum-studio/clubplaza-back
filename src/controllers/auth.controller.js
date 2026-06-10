import * as authService from '../services/auth.service.js'

export async function register(req, res) {
  const result = await authService.register(req.body)
  res.status(201).json(result)
}

export async function login(req, res) {
  const result = await authService.login(req.body)
  res.json(result)
}

export async function me(req, res) {
  res.json({
    user: req.auth.user,
    profile: req.auth.profile,
  })
}

export async function refresh(req, res) {
  const { refresh_token: refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ error: 'refresh_token es requerido' })
  }

  const session = await authService.refreshSession(refreshToken)
  res.json({ session })
}
