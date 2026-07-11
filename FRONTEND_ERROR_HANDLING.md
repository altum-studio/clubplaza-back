# Manejo de Errores del Backend — Guía para el Frontend

## Estructura de respuesta de error

Todos los errores del backend tienen esta forma:

```json
{ "error": "Mensaje legible para el usuario" }
```

En algunos casos (validaciones complejas) puede incluir un campo adicional:

```json
{ "error": "Mensaje", "details": { ... } }
```

El campo `error` siempre es un string en español, listo para mostrar al usuario.

---

## Comportamiento por status code

| Status | Categoría | Acción general en el frontend |
|--------|-----------|-------------------------------|
| `400` | Input inválido | Mostrar `error` cerca del campo o formulario |
| `401` | No autenticado | Redirigir al login y limpiar sesión |
| `403` | Sin permiso | Mostrar mensaje de acceso denegado, no redirigir |
| `404` | Recurso no encontrado | Mostrar mensaje en pantalla o redirigir a listado |
| `409` | Conflicto de negocio | Mostrar `error` como alerta (no es un error de formulario) |
| `500` | Error interno | Mostrar mensaje genérico ("Ocurrió un error, intentá de nuevo") |
| `502` | Error de gateway | Igual que 500 |

---

## Módulos

### Auth (`/api/auth`)

| Endpoint | Mensaje | Status | Cuándo mostrarlo |
|----------|---------|--------|-----------------|
| `POST /register` | `password es requerido` | 400 | Campo vacío al registrar |
| `POST /register` | `Campos requeridos: {campos}` | 400 | Faltan datos del formulario |
| `POST /register` | `Rol inválido` | 400 | Valor de rol inesperado |
| `POST /register` | `El email ya está registrado` | 400 | Email duplicado — mostrar inline en el campo email |
| `POST /register` | `No se pudo crear el usuario` | 500 | Error genérico al registrar |
| `POST /login` | `Credenciales inválidas` | 401 | Email o contraseña incorrectos |
| `POST /login` | `Perfil de usuario no encontrado` | 404 | Usuario sin perfil (raro, error interno) |
| `POST /refresh` | `No se pudo refrescar la sesión` | 401 | Token expirado — redirigir al login |
| `POST /reset-password` | `La contraseña debe tener al menos 6 caracteres` | 400 | Validación de formulario |
| `POST /reset-password` | `El enlace no es válido o expiró` | 401 | Link de reset inválido o vencido |

**Notas:**
- Al recibir `401` en cualquier endpoint autenticado (no solo login), limpiar el token local y redirigir al login.
- El error de Supabase Auth se reenvía directamente cuando falla la creación del usuario en auth.

---

### Usuarios (`/api/usuarios`)

| Endpoint | Mensaje | Status | Cuándo mostrarlo |
|----------|---------|--------|-----------------|
| `POST /` | `password y rol son requeridos` | 400 | Formulario de creación |
| `POST /` | `Campos requeridos: {campos}` | 400 | Campos faltantes |
| `POST /` | `Un usuario local debe tener al menos un local asignado` | 400 | Crear usuario local sin locales |
| `POST /` | `No se pudo crear el usuario` | 500 | Error genérico al crear |
| `GET /:id` | `Usuario no encontrado` | 404 | ID inválido o eliminado |
| `PATCH /me` | `No hay campos válidos para actualizar` | 400 | Formulario enviado vacío |
| `PATCH /me` | `No se pudo actualizar el usuario` | 500 | Error genérico al actualizar |
| `DELETE /:id` | `No se pudo eliminar el usuario` | 500 | Error al borrar |
| `GET /codigo/:codigo` | `codigo es requerido` | 400 | Código vacío en el scanner |
| `GET /codigo/:codigo` | `Miembro no encontrado` | 404 | QR o código inválido |
| `GET /codigo/:codigo` | `Miembro inactivo` | 409 | El miembro existe pero está inactivo — mostrar alerta clara |

---

### Locales (`/api/locales`)

| Endpoint | Mensaje | Status | Cuándo mostrarlo |
|----------|---------|--------|-----------------|
| `POST /` | `nombre es requerido` | 400 | Validación de formulario |
| `POST /` | `nro_local es requerido` | 400 | Validación de formulario |
| `POST /` | `rubro es requerido` | 400 | Selector de rubro vacío |
| `POST /` | `rubro inválido. Opciones: {lista}` | 400 | Valor de rubro no permitido |
| `POST /` | `No se pudo crear el local` | 500 | Error genérico |
| `GET /:id` | `Local no encontrado` | 404 | ID inválido |
| `PATCH /:id` | `Solo podés actualizar tu propio local` | 403 | Intento de editar local ajeno |
| `PATCH /:id` | `No hay campos válidos para actualizar` | 400 | Formulario vacío |
| `PATCH /:id` | `No se pudo actualizar el local` | 500 | Error genérico |
| `GET /mine` | `Tu usuario no tiene un local asignado` | 404 | Usuario sin local — flujo de onboarding |
| `PATCH /mine` | `Tu usuario no tiene un local asignado` | 404 | Igual al anterior |
| `DELETE /:id` | `No se pudo eliminar el local` | 500 | Error genérico |

**Notas:**
- Los errores de validación de `horarios` son muy detallados (día duplicado, formato HH:MM, etc.). Mostrarlos directamente al usuario en el componente de horarios.
- El error `Tu usuario no tiene un local asignado` (404) en `GET /mine` puede usarse para detectar que el usuario necesita completar su perfil.

---

### Promos (`/api/promos`)

| Endpoint | Mensaje | Status | Cuándo mostrarlo |
|----------|---------|--------|-----------------|
| `POST /` | `local_id es requerido` | 400 | Formulario de creación (admin) |
| `POST /` | `titulo es requerido` | 400 | Campo título vacío |
| `POST /` | `tipo es requerido` | 400 | Sin tipo de beneficio |
| `POST /` | `tipo inválido. Opciones: {lista}` | 400 | Tipo no permitido |
| `POST /` | `precio_anterior es requerido...` | 400 | Falta precio en tipo `descuento_fijo` |
| `POST /` | `precio_nuevo es requerido...` | 400 | Falta precio nuevo |
| `POST /` | `precio_nuevo debe ser menor que precio_anterior` | 400 | Precios incoherentes |
| `POST /` | `valor es requerido para el tipo "{tipo}"` | 400 | Falta el valor del beneficio |
| `POST /` | `limite_cantidad debe ser un entero positivo` | 400 | Límite de uso inválido |
| `POST /` | `limite_periodo es requerido cuando se define limite_cantidad` | 400 | Falta período con límite definido |
| `POST /` | `limite_periodo inválido. Opciones: {lista}` | 400 | Período no permitido |
| `POST /` | `vigencia_desde y vigencia_hasta son requeridas` | 400 | Sin fechas de vigencia |
| `POST /` | `vigencia_hasta debe ser igual o posterior a vigencia_desde` | 400 | Fechas incoherentes |
| `POST /` | `dias es requerido (al menos un día)` | 400 | Sin días seleccionados |
| `POST /` | `dias debe contener enteros entre 0 y 6` | 400 | Días inválidos |
| `GET /:id` | `Promo no encontrada` | 404 | ID inválido |
| `PATCH /:id` | `Solo podés gestionar promos de tu local` | 403 | Intento de editar promo ajena |
| `PATCH /:id` | `No hay campos válidos para actualizar` | 400 | Formulario vacío |
| `DELETE /:id` | `Solo podés gestionar promos de tu local` | 403 | Igual al anterior |

**Notas:**
- Los errores de validación de promos son muy específicos. El front puede mostrarlos directamente como feedback inline en el formulario.
- Para `dias`: 0=Domingo, 1=Lunes, ..., 6=Sábado.

---

### Canjes (`/api/canjes`)

| Endpoint | Mensaje | Status | Cuándo mostrarlo |
|----------|---------|--------|-----------------|
| `POST /` | `promo_id es requerido` | 400 | Falta seleccionar promo |
| `POST /` | `codigo o usuario_id es requerido` | 400 | Sin identificación del miembro |
| `POST /` | `No tenés permisos para registrar canjes` | 403 | Rol sin acceso |
| `POST /` | `Esa promo no es de tu local` | 403 | Promo de otro local |
| `POST /` | `El beneficio no es válido hoy` | 409 | Día no habilitado para la promo |
| `POST /` | `El miembro está inactivo` | 409 | Miembro no puede canjear |
| `POST /` | *(mensaje de límite de uso)* | 409 | Límite diario/semanal/mensual/de vigencia alcanzado |
| `POST /` | `No se pudo registrar el canje` | 500 | Error al guardar |

**Mensajes de límite (409):**
- `dia` → "Ya usaste este beneficio hoy"
- `semana` → "Ya usaste este beneficio esta semana"
- `mes` → "Ya usaste este beneficio este mes"
- `vigencia` → "Ya usaste este beneficio durante su vigencia"

**Notas:**
- Los errores `409` en canjes son flujos normales de negocio. Mostrarlos como alertas visibles (no como errores de formulario), ya que el operador necesita ver claramente por qué no puede canjear.

---

### Escaneos (`/api/escaneos`)

| Endpoint | Mensaje | Status | Cuándo mostrarlo |
|----------|---------|--------|-----------------|
| `POST /` | `codigo es requerido` | 400 | Scanner sin input |
| `POST /` | `El miembro está inactivo` | 409 | Miembro inactivo al escanear |
| `POST /` | `No se pudo registrar el escaneo` | 500 | Error al guardar |

**Notas:**
- En el flujo de escaneo de QR, el error `409` debe mostrarse con color rojo prominente ya que el operador necesita feedback inmediato.

---

### Upload (`/api/upload`)

| Endpoint | Mensaje | Status | Cuándo mostrarlo |
|----------|---------|--------|-----------------|
| `POST /` | `No se recibió ningún archivo` | 400 | Sin archivo adjunto |
| `POST /?tipo=logo` | `El logo debe ser un archivo SVG (image/svg+xml)` | 400 | Tipo de archivo incorrecto |
| `POST /?tipo=banner` | `El banner debe ser PNG, JPG o WebP` | 400 | Tipo de archivo incorrecto |
| `POST /` | `El query param "tipo" debe ser "logo" o "banner"` | 400 | Param faltante o inválido |
| `POST /?tipo=logo` | `El logo no puede superar 512 KB` | 400 | Archivo muy pesado |
| `POST /?tipo=banner` | `El banner no puede superar 2 MB` | 400 | Archivo muy pesado |
| `POST /` | `No se pudo subir la imagen` | 500 | Error al subir a storage |

**Notas:**
- Validar tipo y tamaño de archivo en el cliente **antes** de hacer el request para mejorar UX, pero igual manejar estos errores como fallback.
- Logo: solo SVG, máx 512 KB. Banner: PNG/JPG/WebP, máx 2 MB.

---

## Middleware de autenticación y autorización

Estos errores pueden aparecer en **cualquier endpoint** protegido:

| Mensaje | Status | Acción |
|---------|--------|--------|
| `Token de autenticación requerido` | 401 | Redirigir al login |
| `Token inválido o expirado` | 401 | Limpiar sesión y redirigir al login |
| `Perfil de usuario no encontrado` | 404 | Error de estado inconsistente — cerrar sesión |
| `No autenticado` | 401 | Redirigir al login |
| `No tenés permisos para esta acción` | 403 | Mostrar mensaje de acceso denegado |
| `Solo podés gestionar tu propio local` | 403 | Mostrar mensaje de acceso denegado |

---

## Implementación sugerida (interceptor centralizado)

```js
// Con axios
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const { error: message, details } = error.response?.data ?? {}

    switch (status) {
      case 401:
        clearSession()
        redirectToLogin()
        break
      case 403:
        showAccessDenied(message)
        break
      case 409:
        showBusinessAlert(message) // alerta prominente, no error de formulario
        break
      case 500:
      case 502:
        showGenericError()
        break
      default:
        // 400, 404: dejar que cada pantalla los maneje con el mensaje
        break
    }

    return Promise.reject({ status, message, details })
  }
)
```

Para los errores `400` y `404`, se recomienda que cada pantalla capture el rechazo y muestre el `message` directamente, ya que son específicos del contexto.
