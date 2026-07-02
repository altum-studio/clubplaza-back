# Backend spec — Recuperar contraseña ("olvidé mi contraseña")

Para el **backend dev**. El frontend ya está listo (pantallas + llamadas); faltan **2 endpoints públicos**. Base: `{API_URL}/api`. Respuestas de error en el formato habitual `{ "error": "mensaje" }`.

## Resumen del flujo

1. El usuario entra a `/recuperar`, pone su email → front llama **`POST /api/auth/forgot-password`**.
2. El backend dispara el mail de recuperación (Supabase) con un link a la app: **`{APP_URL}/restablecer`**.
3. El usuario abre el link (trae un **token** temporal), pone la clave nueva → front llama **`POST /api/auth/reset-password`** con el token + la contraseña.
4. El backend valida el token y actualiza la contraseña.

`APP_URL` = la URL del front (producción: `https://plaza-altum.vercel.app`).

---

## 1. `POST /api/auth/forgot-password`

- **Auth:** pública (sin token).
- **Body:** `{ "email": "vos@correo.com" }`
- **Qué hace:** manda el mail con el link de reseteo.

**Implementación sugerida (Supabase):**

```js
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.APP_URL}/restablecer`,
});
```

- **Response 200 (SIEMPRE, exista o no el email):**
  ```json
  { "ok": true }
  ```
  > Importante: **no** revelar si el email existe (evita enumeración de usuarios). El front ya muestra "si el email existe, te llegó un link" en todos los casos. Devolver 200 aunque el email no exista o Supabase falle silenciosamente.

---

## 2. `POST /api/auth/reset-password`

- **Auth:** pública (el token del link es la credencial).
- **Body:** `{ "token": "<token del link>", "password": "<nueva>" }`
- **Qué hace:** valida el token y setea la contraseña nueva.

**Validaciones:**
- `password` mínimo 6 caracteres (el front ya lo valida, revalidar en back).
- Token inválido/vencido → **400/401** con `{ "error": "El enlace no es válido o expiró" }`.

**Response 200:**
```json
{ "ok": true }
```

### Sobre el token — 2 variantes (elegí la que te quede más cómoda)

**A) Recovery de Supabase (recomendado, menos código):**
`resetPasswordForEmail` genera un link cuyo hash trae `access_token` (`.../restablecer#access_token=...&type=recovery`). El front lee ese `access_token` y lo manda como `token`. En el backend, con ese token actualizás la clave:

```js
// cliente supabase autenticado con el access_token del usuario
const { error } = await supabaseWithUserToken(token).auth.updateUser({ password });
```

o con admin, resolviendo el user del token y `supabase.auth.admin.updateUserById(userId, { password })`.

**B) Token propio:** si preferís, generá tu propio token (JWT/uuid con expiración) al mandar el mail, guardalo, y en este endpoint verificás y actualizás con `admin.updateUserById`. El link entonces sería `.../restablecer?token=<tuyo>`.

> El front es **flexible**: lee el token del hash (`#access_token=`) o del query (`?token=` / `?code=`), así que cualquiera de las dos variantes funciona sin cambios en el front.

---

## 3. Notas para el front (ya implementado)

- Pantallas: `/recuperar` (pedir link) y `/restablecer` (nueva contraseña).
- Llamadas: `api.auth.forgotPassword(email)` y `api.auth.resetPassword(token, password)`.
- El link del mail **debe** apuntar a `{APP_URL}/restablecer` (con el token en hash o query).
- La ruta `/restablecer` ya está contemplada en el SPA fallback de Vercel (`vercel.json`), así que abrir el link directo funciona.
