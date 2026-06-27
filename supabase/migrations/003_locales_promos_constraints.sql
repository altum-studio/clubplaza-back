
UPDATE public.locales
SET nro_local = 'S/E'
WHERE nro_local IS NULL OR btrim(nro_local) = '';

UPDATE public.locales
SET rubro = 'servicios'
WHERE rubro IS NULL;

UPDATE public.promos p
SET rubro = l.rubro
FROM public.locales l
WHERE p.local_id = l.id
  AND p.rubro IS NULL
  AND l.rubro IS NOT NULL;

UPDATE public.promos
SET tipo = 'descuento'
WHERE tipo IS NULL;

UPDATE public.promos
SET dias = ARRAY[1, 2, 3, 4, 5]
WHERE dias IS NULL;

UPDATE public.promos
SET vigencia_desde = CURRENT_DATE
WHERE vigencia_desde IS NULL;

UPDATE public.promos
SET vigencia_hasta = CURRENT_DATE + INTERVAL '1 year'
WHERE vigencia_hasta IS NULL;

UPDATE public.promos
SET limite_periodo = 'ilimitado'
WHERE limite_periodo IS NULL;

ALTER TABLE public.locales
  ALTER COLUMN nro_local SET NOT NULL,
  ALTER COLUMN rubro SET NOT NULL;

ALTER TABLE public.promos
  ALTER COLUMN tipo SET NOT NULL,
  ALTER COLUMN dias SET NOT NULL,
  ALTER COLUMN vigencia_desde SET NOT NULL,
  ALTER COLUMN vigencia_hasta SET NOT NULL,
  ALTER COLUMN rubro SET NOT NULL,
  ALTER COLUMN limite_periodo SET NOT NULL;
