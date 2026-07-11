# GET /api/usuarios/altas

Devuelve las altas de usuarios agrupadas por período (mes o semana), incluyendo los buckets sin registros con `count: 0`.

---

## Autenticación

Requiere token JWT en el header:

```
Authorization: Bearer <token>
```

Solo accesible para usuarios con rol **admin**.

---

## Query params

| Parámetro | Tipo   | Requerido | Valores posibles   | Descripción                          |
|-----------|--------|-----------|--------------------|--------------------------------------|
| `periodo` | string | Sí        | `mes` \| `semana`  | Define el agrupamiento del resultado |

---

## Respuestas

### `periodo=mes`

Devuelve un array de **12 elementos**, uno por mes, desde hace 11 meses hasta el mes actual.

```http
GET /api/usuarios/altas?periodo=mes
```

```json
[
  { "periodo": "2025-08", "count": 14 },
  { "periodo": "2025-09", "count": 9 },
  { "periodo": "2025-10", "count": 0 },
  { "periodo": "2025-11", "count": 22 },
  { "periodo": "2025-12", "count": 7 },
  { "periodo": "2026-01", "count": 0 },
  { "periodo": "2026-02", "count": 3 },
  { "periodo": "2026-03", "count": 11 },
  { "periodo": "2026-04", "count": 0 },
  { "periodo": "2026-05", "count": 5 },
  { "periodo": "2026-06", "count": 18 },
  { "periodo": "2026-07", "count": 2 }
]
```

- Formato del campo `periodo`: `YYYY-MM`
- Siempre 12 elementos, en orden cronológico ascendente

---

### `periodo=semana`

Devuelve un array de **7 elementos**, uno por día, desde hace 6 días hasta hoy.

```http
GET /api/usuarios/altas?periodo=semana
```

```json
[
  { "periodo": "2026-07-05", "count": 3 },
  { "periodo": "2026-07-06", "count": 1 },
  { "periodo": "2026-07-07", "count": 0 },
  { "periodo": "2026-07-08", "count": 5 },
  { "periodo": "2026-07-09", "count": 0 },
  { "periodo": "2026-07-10", "count": 2 },
  { "periodo": "2026-07-11", "count": 4 }
]
```

- Formato del campo `periodo`: `YYYY-MM-DD`
- Siempre 7 elementos, en orden cronológico ascendente
- Las fechas están en zona horaria **America/Argentina/Buenos_Aires**

---

## Errores

| Status | Descripción                                      |
|--------|--------------------------------------------------|
| `400`  | `periodo` no enviado o valor distinto de `mes`/`semana` |
| `401`  | Token ausente o inválido                         |
| `403`  | El usuario no tiene rol admin                    |
