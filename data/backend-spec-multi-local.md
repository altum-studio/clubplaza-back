# Backend spec — Multi-local (un usuario gestiona varios locales)

Para el **backend dev**. Objetivo: que un usuario con rol `local` pueda **gestionar varios locales** y switchear entre ellos, y que **varios usuarios** puedan gestionar **un mismo local** (relación N↔N vía **tabla intermedia**). El consumidor final no cambia: cada local se sigue viendo como marca separada.

El **front ya está hecho** y degrada bien: si estos endpoints todavía no existen, sigue funcionando en modo un-local (como hoy). Ver §7.

---

## 1. Modelo de datos — tabla intermedia

Crear la tabla que vincula usuarios ↔ locales:

```sql
CREATE TABLE local_managers (
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  local_id   uuid NOT NULL REFERENCES locales(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, local_id)
);
CREATE INDEX idx_local_managers_usuario ON local_managers(usuario_id);
CREATE INDEX idx_local_managers_local   ON local_managers(local_id);
```

**Migración de datos existentes:** por cada usuario rol `local` que hoy tiene `usuarios.local_id`, insertar una fila:

```sql
INSERT INTO local_managers (usuario_id, local_id)
SELECT id, local_id FROM usuarios
WHERE rol = 'local' AND local_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

**`usuarios.local_id`:** dejarlo (lo usamos como "local principal" / compatibilidad). La **fuente de verdad para permisos es `local_managers`**. Si preferís, más adelante se puede deprecar, pero por ahora conviene mantenerlo sincronizado (= el primero de la lista).

> **Regla de oro de permisos:** en TODO endpoint del panel, el usuario solo puede operar sobre un `local_id` **si existe la fila `(usuario_id, local_id)` en `local_managers`** (o si es `admin`). Si no, **403**.

---

## 2. Auth / profile — devolver `local_ids`

En **login, register y `GET /api/auth/me`**, agregar al `profile` el array de locales que gestiona:

```json
{
  "profile": {
    "id": "…",
    "rol": "local",
    "local_id": "uuid-principal",
    "local_ids": ["uuid-local-1", "uuid-local-2"],
    "codigo": "A7K2QM",
    "...": "..."
  }
}
```

- `local_ids`: array de UUIDs (todas las filas de `local_managers` de ese usuario). Vacío `[]` si no gestiona ninguno.
- Para `comun`/`admin`: `local_ids` puede venir `[]` o ausente.

---

## 3. `GET /api/locales/mias` (NUEVO)

Devuelve **todos los locales que gestiona** el usuario logueado (objetos `Local` completos, no solo ids). Es lo que el front usa para armar el switcher.

- **Auth:** rol `local`.
- **Query:** ninguno.
- **Response 200:** **array** de `Local` (mismo shape que `GET /api/locales/:id`):

```json
[
  { "id": "uuid-1", "nombre": "Juan Valdez Café", "nro_local": "L.10", "rubro": "gastronomia", "logo_url": "…", "banner_url": "…", "horarios": [...], "activo": true, "...": "..." },
  { "id": "uuid-2", "nombre": "Almacén de Pizzas", "nro_local": "L.16", "rubro": "gastronomia", "logo_url": "…", "...": "..." }
]
```

> Devolver **array plano** (no `{ data: [...] }`). El front espera `ApiLocal[]`.

Se obtiene con un join: `locales` JOIN `local_managers` WHERE `usuario_id = auth.uid`.

---

## 4. Asignar locales a un usuario (Admin)

En **`POST /api/usuarios`** y **`PATCH /api/usuarios/:id`**, aceptar **`local_ids: string[]`** cuando el rol es `local`:

**Body (ejemplo):**
```json
{
  "nombre": "Carlos", "apellido": "Pérez",
  "rol": "local",
  "local_ids": ["uuid-local-1", "uuid-local-2"],
  "local_id": "uuid-local-1"
}
```

- Al guardar: **reemplazar** las filas de `local_managers` de ese usuario por las de `local_ids` (borrar las que no están, insertar las nuevas).
- `local_id` (singular) que manda el front = el primero de la lista (compat); podés setearlo = `local_ids[0]` o ignorarlo y calcularlo vos.
- Si `rol !== 'local'`: limpiar sus `local_managers` y `local_id = null`.
- **Validación:** rol `local` debe tener al menos 1 local (el front ya lo valida; revalidar).

**Devolver `local_ids` en las respuestas de usuarios** (`GET /api/usuarios`, `GET /api/usuarios/:id`) para que el admin vea la asignación. En el listado alcanza con el array de ids (el front muestra "N locales"); el join `locales` singular actual lo podés dejar como está (primer local) para compatibilidad.

---

## 5. Scope + permisos por local activo (⚠️ el cambio grande)

Hoy los endpoints `mine` deducen el local del token (uno solo). Ahora deben aceptar **`local_id`** (cuál de los locales que gestiona el usuario) y **verificar pertenencia** en `local_managers`. Si `local_id` se omite → usar el **principal** (`usuarios.local_id` o el primero).

| Endpoint | Cambio |
|---|---|
| `GET /api/promos/mine/mis-promos?local_id=X` | filtra promos del local X (verificar pertenencia) |
| `POST /api/promos/mine/mis-promos` | body trae `local_id: X` → crea la promo en el local X |
| `GET /api/canjes/mine?local_id=X` | historial de canjes del local X |
| `GET /api/canjes/stats/mine?local_id=X` | métricas del local X |
| `GET /api/escaneos/mine?local_id=X` | historial de escaneos del local X |
| `POST /api/escaneos` | body trae `local_id: X` → el escaneo se registra para el local X |
| `POST /api/canjes` | body trae `local_id: X` → el canje se atribuye al local X (además la promo debe ser de ese local) |
| `PATCH /api/locales/:id` | editar (permitir si el usuario gestiona ese local, no solo si es dueño único) |
| `GET /api/locales/mine/mi-local` | (queda para compat; devuelve el principal) |

**Reglas por cada uno:**
- Si viene `local_id` y el usuario **no** lo gestiona (no está en `local_managers`) → **403** `No gestionás ese local`.
- Si no viene `local_id` → usar el principal del usuario.
- En `POST /api/canjes`: además de verificar el local, la `promo_id` tiene que pertenecer a ese `local_id` (si no → 403 `Esa promo no es de ese local`).

---

## 6. Seguridad (imprescindible)

- **Nunca** confiar en el `local_id` que manda el front sin chequear que el usuario lo gestione (`local_managers`). Esto va en **todos** los endpoints de §5.
- `admin` puede operar sobre cualquier local (como hoy).
- El `local_managers` con `ON DELETE CASCADE` limpia solo si se borra el usuario o el local.

---

## 7. Qué ya hizo el front (para que sepas cómo consume)

- **Login/me:** lee `profile.local_ids`.
- **Switcher:** `GET /api/locales/mias` → lista de locales; si son >1, aparece un selector (con el logo de cada local) en el header del panel. El local activo se guarda en el navegador.
- **Todo el panel** manda `local_id` = local activo:
  - Beneficios: `promos.mine({ local_id })` y `createMine({ ..., local_id })`.
  - Validar: `escaneos.create` y `canjes.create` con `local_id`.
  - Inicio / Stats / Historial: `canjes.mine`, `canjes.statsMine`, `escaneos.mine` con `local_id`.
  - Mi local: edita el local activo con `PATCH /api/locales/:id`.
- **Admin:** `UsuarioFormModal` manda `local_ids: string[]` (+ `local_id` = el primero) al crear/editar usuarios rol `local`.

**Compatibilidad:** mientras `GET /api/locales/mias` no exista, el front no muestra switcher y el panel funciona en modo un-local (los `local_id` que manda quedan sin efecto si el back los ignora y sigue deduciendo del token). Así el deploy del front no depende del back.

---

## Checklist backend
- [ ] Tabla `local_managers` + migración de `usuarios.local_id`
- [ ] `profile.local_ids` en login/register/me
- [ ] `GET /api/locales/mias` (array de `Local`)
- [ ] `POST`/`PATCH /api/usuarios` aceptan `local_ids` (reemplazan las filas)
- [ ] `usuarios` list/get devuelven `local_ids`
- [ ] `local_id` (query o body) + verificación de pertenencia en: promos.mine, promos.createMine, canjes.mine, canjes.stats/mine, escaneos.mine, escaneos POST, canjes POST, locales PATCH
- [ ] `admin` sigue pudiendo con cualquier local
