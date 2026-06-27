
CREATE TYPE public.canje_estado AS ENUM ('ok', 'rechazado', 'repetido');

-- Código único de miembro (6 chars alfanuméricos)
ALTER TABLE public.usuarios ADD COLUMN codigo text;

CREATE UNIQUE INDEX usuarios_codigo_idx ON public.usuarios (codigo);

-- Backfill de códigos para usuarios existentes
DO $$
DECLARE
  r RECORD;
  new_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  done bool;
  i int;
BEGIN
  FOR r IN SELECT id FROM public.usuarios WHERE codigo IS NULL LOOP
    done := false;
    WHILE NOT done LOOP
      new_code := '';
      FOR i IN 1..6 LOOP
        new_code := new_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
      END LOOP;
      IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE codigo = new_code) THEN
        UPDATE public.usuarios SET codigo = new_code WHERE id = r.id;
        done := true;
      END IF;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.usuarios ALTER COLUMN codigo SET NOT NULL;

-- Canjes de beneficios
CREATE TABLE public.canjes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  promo_id   uuid NOT NULL REFERENCES public.promos (id) ON DELETE CASCADE,
  local_id   uuid NOT NULL REFERENCES public.locales (id) ON DELETE CASCADE,
  estado     public.canje_estado NOT NULL DEFAULT 'ok',
  fecha      timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX canjes_usuario_promo_fecha_idx ON public.canjes (usuario_id, promo_id, fecha);
CREATE INDEX canjes_local_fecha_idx ON public.canjes (local_id, fecha);
CREATE INDEX canjes_promo_idx ON public.canjes (promo_id);

-- Log de escaneos de credencial
CREATE TABLE public.escaneos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id     uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  local_id     uuid NOT NULL REFERENCES public.locales (id) ON DELETE CASCADE,
  escaneado_en timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX escaneos_local_escaneado_idx ON public.escaneos (local_id, escaneado_en);
CREATE INDEX escaneos_socio_idx ON public.escaneos (socio_id);

-- RLS (defensa en profundidad; la API usa service role)
ALTER TABLE public.canjes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escaneos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve todos los canjes"
ON public.canjes FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'admin')
);

CREATE POLICY "Local ve canjes de su local"
ON public.canjes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() AND u.rol = 'local' AND u.local_id = canjes.local_id
  )
);

CREATE POLICY "Admin ve todos los escaneos"
ON public.escaneos FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'admin')
);

CREATE POLICY "Local ve escaneos de su local"
ON public.escaneos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() AND u.rol = 'local' AND u.local_id = escaneos.local_id
  )
);

CREATE POLICY "Local inserta escaneos en su local"
ON public.escaneos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() AND u.rol = 'local' AND u.local_id = escaneos.local_id
  )
);
