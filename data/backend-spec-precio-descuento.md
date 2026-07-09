# Backend spec — Precio anterior / nuevo en beneficios "Descuento $"

Para el **backend dev**. El front ya está listo (form + display). Falta agregar **2 campos** al modelo de beneficios (`promos`) para el tipo **`descuento_fijo`** ("Descuento $"), que ahora muestra **precio anterior tachado + precio nuevo**.

## 1. Migración (tabla `promos`)

Agregar dos columnas numéricas **nullable**:

```sql
ALTER TABLE promos
  ADD COLUMN precio_anterior numeric,   -- precio original (se muestra tachado)
  ADD COLUMN precio_nuevo    numeric;   -- precio con el descuento
```

(`numeric`/`decimal` para soportar centavos; si los precios son enteros, `integer` también sirve.)

## 2. API — aceptar y devolver los campos

- **`POST /api/promos`** y **`POST /api/promos/mine/mis-promos`**: aceptar `precio_anterior` y `precio_nuevo` en el body.
- **`PATCH /api/promos/:id`** (y el de `mine`): idem, editables.
- **`GET`** (listado, detalle, `mine`): incluir `precio_anterior` y `precio_nuevo` en la respuesta de cada promo.

Ejemplo de body para un beneficio "Descuento $":

```json
{
  "titulo": "Zapatillas running",
  "tipo": "descuento_fijo",
  "precio_anterior": 120000,
  "precio_nuevo": 84000,
  "valor": 84000,
  "dias": [1,2,3,4,5],
  "vigencia_desde": "2026-07-01",
  "vigencia_hasta": "2026-07-31"
}
```

## 3. Validación (cambio respecto de la guía anterior)

Hoy el backend exige `valor` cuando `tipo` es `descuento_fijo`. **Cambiarlo así:**

- **`tipo = 'descuento_fijo'`** → requerir **`precio_anterior`** y **`precio_nuevo`** (ambos > 0, y idealmente `precio_nuevo < precio_anterior`). **`valor` ya NO es obligatorio** para este tipo.
- Los otros tipos que sí usan `valor` no cambian: `descuento` (%) y `cuotas` siguen exigiendo `valor`.

> Nota de compatibilidad: mientras el back no tenga estas columnas, el front sigue mandando `valor = precio_nuevo` para no romper la validación actual, y muestra solo el precio nuevo. Cuando el back guarde/devuelva `precio_anterior` y `precio_nuevo`, el front pasa a mostrar automáticamente **~~precio anterior~~ precio nuevo**. Así el deploy del front no depende del back.

## 4. Resumen para el front (ya implementado)

- Tipos `ApiPromo`/`Promo` con `precio_anterior` y `precio_nuevo`.
- Form de beneficio (`BeneficioFormModal`): al elegir "Descuento $" aparecen los campos **Precio anterior** y **Precio nuevo** (en vez del campo "Valor").
- Display (`BenefitValue`): para `descuento_fijo` muestra el precio anterior **tachado** + el nuevo; para el resto, la etiqueta de siempre.
