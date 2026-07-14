# Backend spec — Horarios de locales: aceptar cualquier rango (incl. cruce de medianoche)

Para el **backend dev**. El front ya está listo: el editor de horarios deja cargar
cualquier `desde`/`hasta` y manda el horario tal cual, **sin validar nada**. El
problema es que el backend **rechaza algunos rangos** al guardar el local.

## Síntoma reportado

Al editar el horario de un local y guardar:

- **08:00 → 00:00** (abre a la mañana, cierra a medianoche) → **error**.
- **22:00 → 02:00** (cierra de madrugada) → **error**.

En cambio el horario por defecto (10:00 → 21:00) guarda bien.

## Causa

El backend está validando que `hasta > desde` **dentro del mismo día**. Eso rompe
todos los rangos que **cruzan la medianoche**, que son totalmente válidos para
gastronomía, bares, etc. (`hasta` numéricamente es menor que `desde`).

## Formato que manda el front

`PATCH /api/locales/:id` (y `POST` en alta) manda el campo `horarios` así:

```json
{
  "horarios": [
    { "dia": 1, "cerrado": false, "rangos": [["08:00", "00:00"]] },
    { "dia": 2, "cerrado": false, "rangos": [["10:00", "21:00"]] },
    { "dia": 5, "cerrado": false, "rangos": [["20:00", "02:00"]] },
    { "dia": 0, "cerrado": true,  "rangos": [] }
  ]
}
```

- `dia`: 0 = Domingo … 6 = Sábado.
- `cerrado: true` → ese día no abre (`rangos` viene vacío).
- `rangos`: lista de pares `["HH:MM", "HH:MM"]` (formato 24h). Hoy el front manda
  **un solo rango por día**, pero el modelo soporta varios.

## Qué se pide

1. **Aceptar rangos que cruzan la medianoche**: si `hasta <= desde`, interpretarlo
   como que cierra al día siguiente (ej. `20:00 → 02:00`). **No** rechazar.
2. **No rechazar rangos válidos** como `08:00 → 12:00` o `08:00 → 00:00`.
3. Guardar y devolver `horarios` tal cual (es un JSON, no requiere lógica extra).
4. Si igual se quiere validar algo, que sea solo el **formato** (`HH:MM`, 00:00–23:59)
   y devolver un **400 con mensaje claro** (ej. `"Formato de hora inválido"`), no un
   500 genérico.

## Regla simple sugerida

Un rango `[desde, hasta]` es válido si ambos son horas `HH:MM` válidas. **No**
comparar `hasta > desde`: si `hasta <= desde`, es un turno que termina al día
siguiente. Punto.
