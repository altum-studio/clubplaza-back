-- Tabla intermedia: un usuario puede gestionar varios locales (N↔N)
CREATE TABLE local_managers (
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  local_id   uuid NOT NULL REFERENCES locales(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, local_id)
);

CREATE INDEX idx_local_managers_usuario ON local_managers(usuario_id);
CREATE INDEX idx_local_managers_local   ON local_managers(local_id);

-- Migrar datos existentes: cada usuario rol 'local' con local_id asignado
INSERT INTO local_managers (usuario_id, local_id)
SELECT id, local_id FROM usuarios
WHERE rol = 'local' AND local_id IS NOT NULL
ON CONFLICT DO NOTHING;
