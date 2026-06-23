-- ============================================================
-- Migración 002 — Actualización de schema: Locales y Promos
-- ============================================================

-- ─── LOCALES ──────────────────────────────────────────────

-- Renombrar piso -> nro_local
ALTER TABLE public.locales RENAME COLUMN piso TO nro_local;

-- Nuevos campos
ALTER TABLE public.locales
  ADD COLUMN rubro      text,
  ADD COLUMN banner_url text,
  ADD COLUMN horarios   jsonb;

-- Constraint de valores válidos para rubro
ALTER TABLE public.locales
  ADD CONSTRAINT locales_rubro_check
  CHECK (rubro IS NULL OR rubro IN (
    'gastronomia', 'almacen', 'salud', 'hogar', 'servicios', 'tecnologia'
  ));

-- Índice para filtrar por rubro
CREATE INDEX locales_rubro_idx ON public.locales (rubro);


-- ─── PROMOS ───────────────────────────────────────────────

-- Renombrar campos existentes
ALTER TABLE public.promos RENAME COLUMN fecha_inicio TO vigencia_desde;
ALTER TABLE public.promos RENAME COLUMN fecha_fin    TO vigencia_hasta;
ALTER TABLE public.promos RENAME COLUMN imagen_url   TO banner_url;

-- descuento (text) → valor (numeric): incompatibles; se elimina y crea nuevo
ALTER TABLE public.promos DROP COLUMN descuento;
ALTER TABLE public.promos ADD COLUMN valor numeric;

-- Nuevos campos
ALTER TABLE public.promos
  ADD COLUMN tipo            text,
  ADD COLUMN dias            int[],
  ADD COLUMN limite_cantidad int,
  ADD COLUMN limite_periodo  text DEFAULT 'ilimitado',
  ADD COLUMN rubro           text;

-- Constraints de valores válidos
ALTER TABLE public.promos
  ADD CONSTRAINT promos_tipo_check
  CHECK (tipo IS NULL OR tipo IN (
    '2x1', '3x2', 'descuento', 'descuento_fijo', 'cuotas',
    'combo', 'regalo', 'envio_gratis', 'bonificacion'
  ));

ALTER TABLE public.promos
  ADD CONSTRAINT promos_limite_periodo_check
  CHECK (limite_periodo IS NULL OR limite_periodo IN (
    'dia', 'semana', 'mes', 'vigencia', 'ilimitado'
  ));

ALTER TABLE public.promos
  ADD CONSTRAINT promos_rubro_check
  CHECK (rubro IS NULL OR rubro IN (
    'gastronomia', 'almacen', 'salud', 'hogar', 'servicios', 'tecnologia'
  ));

-- Índices útiles para filtros del frontend
CREATE INDEX promos_rubro_idx ON public.promos (rubro);
CREATE INDEX promos_tipo_idx  ON public.promos (tipo);


-- ─── STORAGE BUCKETS ──────────────────────────────────────
-- Ejecutar SOLO si los buckets no existen ya en el proyecto.
-- Recomendado crearlos desde el dashboard de Supabase Storage,
-- o descomentar estas líneas si usás supabase-js en el contexto adecuado.

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('logos',   'logos',   true)
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('banners', 'banners', true)
-- ON CONFLICT (id) DO NOTHING;
