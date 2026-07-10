# Backend spec — Estadísticas por mes (selector de calendario)

Para el **backend dev**. El front ya cablea un **selector de mes** en los dashboards (Admin y Panel Local). Para que al cambiar de mes se actualicen los datos, las métricas tienen que aceptar el mes.

## Qué cambia

Agregar el query param **`mes` = `YYYY-MM`** a los endpoints de stats. Default: **mes actual** (comportamiento de hoy, para no romper nada).

| Endpoint | Cambio |
|---|---|
| `GET /api/canjes/stats?local_id=&mes=YYYY-MM` | métricas globales/por-local del mes indicado (admin) |
| `GET /api/canjes/stats/mine?local_id=&mes=YYYY-MM` | métricas del local del mes indicado (rol local) |

### Respuesta (mismo shape de siempre, pero del mes pedido)

```json
{
  "canjes_mes": 42,
  "canjes_ultimos_7_dias": [
    { "fecha": "2026-05-01", "cantidad": 3 },
    { "fecha": "2026-05-02", "cantidad": 5 }
  ],
  "miembros_unicos_mes": 28,
  "beneficio_mas_canjeado": { "promo_id": "…", "titulo": "…", "cantidad": 15 }
}
```

- **`canjes_mes`**, **`miembros_unicos_mes`**, **`beneficio_mas_canjeado`**: calculados sobre el **mes pedido** (`mes`), no el actual.
- **`canjes_ultimos_7_dias`**: la **serie diaria del mes pedido** (puede ser el mes completo día a día, o los últimos 7 días de ese mes — lo que te resulte más simple). El front dibuja las barras según las `fecha` que devuelvas, así que cualquiera de las dos sirve; con la fecha alcanza.

### Notas
- Si `mes` se omite → mes actual (igual que hoy).
- Formato `mes`: `YYYY-MM` (ej. `2026-05`). Si querés validarlo, rechazá formatos inválidos con 400.
- Todo lo demás (permisos por `local_id`, multi-local) sigue igual que en `backend-spec-multi-local.md`.

## Qué ya hizo el front
- Admin: el KPI "Canjes del mes" y el "Top locales por canjes" se recalculan al cambiar el mes (mandan `?mes=`). "Altas de miembros" ya es **real** (calculado en el front desde las fechas de alta de usuarios) y no depende del back.
- Panel Local (Estadísticas): KPIs + gráfico "Canjes por día" + "Beneficio más canjeado" mandan `?mes=`.
- Mientras el back ignore `mes`, el front sigue mostrando el mes actual (no rompe); apenas lo implementes, el calendario pasa a actualizar los datos.
