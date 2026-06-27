# ClubPlaza · Backend pendiente — Validación de credencial y canjes

Para el equipo de **backend**. El **Panel Local** (comercio) necesita validar la credencial de un
miembro y registrar el canje de un beneficio. Hoy faltan los endpoints para eso. Abajo está lo
necesario para destrabarlo.

Convenciones: auth por `Authorization: Bearer <token>`. Errores con `{ "error": "..." }`.

---

## 0. (Requisito) Código de miembro

Para que el comercio pueda **buscar a un miembro por su código**, el backend tiene que **asignar y
guardar un código corto único por usuario**.

- Agregar al usuario/profile un campo **`codigo`**: string corto, **único**, ej. **6 caracteres
  alfanuméricos** sin caracteres ambiguos (sin `0/O/1/I`), ej. `A7K2QM`.
- Generarlo al **crear el usuario** (registro y alta por admin).
- Devolverlo en el `profile` de `POST /auth/register`, `POST /auth/login` y `GET /auth/me`.

> Hoy el front lo deriva del UUID como parche; cuando exista `codigo` real, el front muestra ese y
> el QR de la credencial codifica ese mismo valor.

---

## 1. Buscar miembro por código

```
GET /api/usuarios/codigo/:codigo
```
- **Auth:** rol `local` o `admin`.
- **Para qué:** el comercio escanea el QR (o tipea el código) y necesita los datos del miembro.

**Response 200:**
```json
{
  "id": "uuid",
  "nombre": "María",
  "apellido": "González",
  "codigo": "A7K2QM",
  "dni": "30123456",
  "activo": true,
  "created_at": "2026-06-01T..."
}
```

**Errores:**
```json
{ "error": "Miembro no encontrado" }     // 404
{ "error": "Miembro inactivo" }          // 200 con activo:false, o 409 — a definir
```

---

## 2. Registrar canje (confirmar validación)

```
POST /api/canjes
```
- **Auth:** rol `local` (registra para **su** local) o `admin`.
- **Body:**
```json
{
  "codigo": "A7K2QM",     // o "usuario_id": "uuid"
  "promo_id": "uuid"
}
```
- **El backend valida (importante):**
  1. El miembro existe y está **activo**.
  2. La promo **pertenece al local** del usuario `local` (no puede canjear promos de otro local).
  3. La promo está **activa** y **vigente**: dentro de `vigencia_desde/hasta` y el **día actual**
     está en `dias`.
  4. Respeta el **límite de uso** (`limite_cantidad` + `limite_periodo`) para ESE miembro en ESA
     promo (ej. "1 por día" → si ya canjeó hoy, rechazar).

**Response 201:**
```json
{
  "id": "uuid",
  "usuario_id": "uuid",
  "promo_id": "uuid",
  "local_id": "uuid",
  "estado": "ok",
  "fecha": "2026-06-26T14:32:00Z"
}
```

**Errores (con mensaje claro para mostrar):**
```json
{ "error": "El miembro está inactivo" }                       // 409
{ "error": "Esa promo no es de tu local" }                    // 403
{ "error": "El beneficio no es válido hoy" }                  // 409  (día/vigencia)
{ "error": "El miembro ya usó este beneficio hoy" }           // 409  (límite)
```

---

## 3. Historial de canjes (Panel Local)

```
GET /api/canjes/mine?desde=&hasta=&estado=&limit=&offset=
```
- **Auth:** rol `local` → devuelve los canjes de **su** local.
- (Equivalente admin: `GET /api/canjes?local_id=&promo_id=&desde=&hasta=`.)

**Response 200:** `{ data: Canje[], count: number }` con join del miembro y la promo:
```json
{
  "data": [
    {
      "id": "uuid",
      "fecha": "2026-06-26T14:32:00Z",
      "estado": "ok",
      "usuarios": { "nombre": "María", "apellido": "González", "codigo": "A7K2QM" },
      "promos": { "titulo": "2x1 en cafetería" }
    }
  ],
  "count": 120
}
```

---

## 4. Métricas (para Dashboard / Estadísticas) — opcional pero ideal

Endpoints de agregados sobre la tabla de canjes (global para admin, por local para `local`):
- Canjes del mes, canjes por día (últimos 7), miembros únicos, beneficio más canjeado, etc.
- Ej.: `GET /api/canjes/stats/mine` (local) y `GET /api/canjes/stats` (admin), devolviendo los
  totales que hoy el front muestra como "Próximamente".

---

## Modelo sugerido — tabla `canjes`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `usuario_id` | uuid | FK al miembro |
| `promo_id` | uuid | FK a la promo |
| `local_id` | uuid | FK al local (se deriva de la promo/usuario local) |
| `estado` | enum | `ok` \| `rechazado` (\| `repetido`) |
| `fecha` | timestamptz | momento del canje |
| `created_at` | timestamptz | |

Índices útiles: `(usuario_id, promo_id, fecha)` para el chequeo de límite, y `(local_id, fecha)`
para historial/métricas.

---

## 6. Log de escaneos (validación de credencial QR)

Decisión tomada con el front:
- El **QR de la credencial codifica el `codigo`** del socio (no el UUID). El validador escanea o
  tipea ese código y resuelve con el endpoint **§1**.
- Además del canje (que es opcional / cuando se aplica un beneficio puntual), se quiere un **log
  simple de cada escaneo** (el comercio validó una credencial), aunque no termine en canje.

```
POST /api/escaneos
```
- **Auth:** rol `local` (registra para **su** local; el `local_id` sale del token, no del body).
- **Body:** `{ "codigo": "A7K2QM" }`
- Resuelve el socio por código, registra el escaneo y devuelve si es válido + si tiene beneficios
  activos en ese local:
```json
{
  "socio": { "nombre": "María González", "activo": true },
  "beneficios_activos": 3,
  "escaneo_id": "uuid"
}
```
- Si el socio no existe o está inactivo → error claro (`404` / `409`), pero igual se puede loguear
  el intento si quieren.

```
GET /api/escaneos/mine?desde=&hasta=&limit=&offset=
```
- **Auth:** rol `local` → historial de escaneos de su local.

### Tabla `escaneos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `socio_id` | uuid | FK al usuario (miembro) escaneado |
| `local_id` | uuid | FK al local que escaneó |
| `escaneado_en` | timestamptz | momento del escaneo |
| `created_at` | timestamptz | |

### RLS sugerida (`escaneos`)
- **INSERT:** permitido si el usuario tiene rol `local` y `local_id = (su local asignado)`
  (no puede registrar escaneos a nombre de otro local).
- **SELECT:** el `admin` ve todo; el `local` ve solo `local_id = su local`.
- (El `socio_id` se resuelve server-side desde el `codigo`, no lo manda el cliente como id.)

> Nota: el front **no** accede a Supabase directo — todo pasa por la API Express con el Bearer
> token. La RLS es defensa en profundidad; la autorización principal la hace la API por rol.

---

**Prioridad:** 0 (campo `codigo` único + en el QR) es requisito de todo. 1 + (2 ó 6) destraban
**Validar**: §1 busca al socio y §6 registra el escaneo (o §2 si además aplican un beneficio). §3
destraba **Historial**, §4 las **métricas**. Apenas estén, el front se conecta sin cambios de diseño.
