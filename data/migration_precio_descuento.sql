-- Migración: agregar precio_anterior y precio_nuevo a la tabla promos
-- Para beneficios de tipo "descuento_fijo" (precio tachado + precio con descuento)

ALTER TABLE promos
  ADD COLUMN precio_anterior numeric,
  ADD COLUMN precio_nuevo    numeric;

COMMENT ON COLUMN promos.precio_anterior IS 'Precio original (se muestra tachado). Solo aplica para tipo descuento_fijo.';
COMMENT ON COLUMN promos.precio_nuevo    IS 'Precio con el descuento aplicado. Solo aplica para tipo descuento_fijo.';
