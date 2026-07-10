export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Club Plaza API',
    version: '1.0.0',
    description: 'API de beneficios para shoppings - Club Plaza',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          count: { type: 'integer', description: 'Total de registros' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          expires_in: { type: 'integer' },
          token_type: { type: 'string', example: 'bearer' },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', format: 'email' },
          dni: { type: 'string' },
          telefono: { type: 'string' },
          fecha_nacimiento: { type: 'string', format: 'date' },
          rol: { type: 'string', enum: ['admin', 'local', 'comun'] },
          local_id: { type: 'string', format: 'uuid', nullable: true },
          local_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
          codigo: { type: 'string' },
          activo: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Local: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string' },
          nro_local: { type: 'string' },
          rubro: {
            type: 'string',
            enum: ['gastronomia', 'almacen', 'salud', 'hogar', 'servicios', 'tecnologia'],
          },
          descripcion: { type: 'string', nullable: true },
          logo_url: { type: 'string', nullable: true },
          banner_url: { type: 'string', nullable: true },
          horarios: { type: 'object', nullable: true },
          activo: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Promo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          local_id: { type: 'string', format: 'uuid' },
          rubro: { type: 'string' },
          titulo: { type: 'string' },
          tipo: {
            type: 'string',
            enum: ['2x1', '3x2', 'descuento', 'descuento_fijo', 'cuotas', 'combo', 'regalo', 'envio_gratis', 'bonificacion'],
          },
          valor: { type: 'number', nullable: true },
          precio_anterior: { type: 'number', nullable: true },
          precio_nuevo: { type: 'number', nullable: true },
          descripcion: { type: 'string', nullable: true },
          dias: { type: 'array', items: { type: 'string' } },
          vigencia_desde: { type: 'string', format: 'date', nullable: true },
          vigencia_hasta: { type: 'string', format: 'date', nullable: true },
          limite_cantidad: { type: 'integer', nullable: true },
          limite_periodo: {
            type: 'string',
            enum: ['dia', 'semana', 'mes', 'vigencia', 'ilimitado'],
          },
          banner_url: { type: 'string', nullable: true },
          activa: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Canje: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          usuario_id: { type: 'string', format: 'uuid' },
          promo_id: { type: 'string', format: 'uuid' },
          local_id: { type: 'string', format: 'uuid' },
          estado: { type: 'string', enum: ['ok', 'rechazado', 'repetido'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Escaneo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          local_id: { type: 'string', format: 'uuid' },
          usuario_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
    parameters: {
      limit: {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', default: 50 },
        description: 'Cantidad de resultados',
      },
      offset: {
        in: 'query',
        name: 'offset',
        schema: { type: 'integer', default: 0 },
        description: 'Desplazamiento para paginación',
      },
      desde: {
        in: 'query',
        name: 'desde',
        schema: { type: 'string', format: 'date-time' },
        description: 'Fecha de inicio del filtro',
      },
      hasta: {
        in: 'query',
        name: 'hasta',
        schema: { type: 'string', format: 'date-time' },
        description: 'Fecha de fin del filtro',
      },
    },
  },
  paths: {
    // ── AUTH ─────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar nuevo usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'nombre', 'apellido', 'fecha_nacimiento', 'dni', 'telefono'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  nombre: { type: 'string' },
                  apellido: { type: 'string' },
                  fecha_nacimiento: { type: 'string', format: 'date' },
                  dni: { type: 'string' },
                  telefono: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } } },
          400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Sesión iniciada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } } },
          400: { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: {
                  refresh_token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Token renovado', content: { 'application/json': { schema: { type: 'object', properties: { session: { $ref: '#/components/schemas/Session' } } } } } },
          400: { description: 'refresh_token requerido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar reseteo de contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Siempre responde ok (no revela si el email existe)', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Resetear contraseña con token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña actualizada', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          400: { description: 'Token inválido o expirado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Usuario y perfil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'object' },
                    profile: { $ref: '#/components/schemas/Usuario' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
    },

    // ── USUARIOS ─────────────────────────────────────────────────────────────
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        parameters: [
          { in: 'query', name: 'rol', schema: { type: 'string', enum: ['admin', 'local', 'comun'] } },
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' } },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
        ],
        responses: {
          200: {
            description: 'Lista paginada de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'Sin permisos' },
        },
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'nombre', 'apellido', 'fecha_nacimiento', 'dni', 'telefono', 'rol'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  nombre: { type: 'string' },
                  apellido: { type: 'string' },
                  fecha_nacimiento: { type: 'string', format: 'date' },
                  dni: { type: 'string' },
                  telefono: { type: 'string' },
                  rol: { type: 'string', enum: ['admin', 'local', 'comun'] },
                  local_id: { type: 'string', format: 'uuid', description: 'Para rol=local (alternativa a local_ids)' },
                  local_ids: { type: 'array', items: { type: 'string', format: 'uuid' }, description: 'Para rol=local con múltiples locales' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'No autenticado' },
          403: { description: 'Sin permisos' },
        },
      },
    },
    '/usuarios/me': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Actualizar mi perfil',
        security: [{ bearerAuth: [] }],
        description: 'Cualquier usuario autenticado. Solo campos permitidos para el propio usuario.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  apellido: { type: 'string' },
                  telefono: { type: 'string' },
                  fecha_nacimiento: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Perfil actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          400: { description: 'Sin campos válidos' },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/usuarios/codigo/{codigo}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Buscar miembro por código',
        security: [{ bearerAuth: [] }],
        description: 'Roles: **admin**, **local**.',
        parameters: [
          { in: 'path', name: 'codigo', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Datos públicos del miembro',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    nombre: { type: 'string' },
                    apellido: { type: 'string' },
                    codigo: { type: 'string' },
                    dni: { type: 'string' },
                    activo: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          404: { description: 'Miembro no encontrado' },
          409: { description: 'Miembro inactivo' },
        },
      },
    },
    '/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          404: { description: 'No encontrado' },
        },
      },
      patch: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  apellido: { type: 'string' },
                  telefono: { type: 'string' },
                  fecha_nacimiento: { type: 'string', format: 'date' },
                  rol: { type: 'string', enum: ['admin', 'local', 'comun'] },
                  activo: { type: 'boolean' },
                  local_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuario actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          400: { description: 'Datos inválidos' },
          404: { description: 'No encontrado' },
        },
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Eliminar usuario',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Eliminado', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } } } } },
          404: { description: 'No encontrado' },
        },
      },
    },

    // ── LOCALES ───────────────────────────────────────────────────────────────
    '/locales': {
      get: {
        tags: ['Locales'],
        summary: 'Listar locales',
        description: 'Público. Admins y locales pueden ver inactivos.',
        parameters: [
          { in: 'query', name: 'activo', schema: { type: 'boolean' } },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Local' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Locales'],
        summary: 'Crear local',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'nro_local', 'rubro'],
                properties: {
                  nombre: { type: 'string' },
                  nro_local: { type: 'string' },
                  rubro: { type: 'string', enum: ['gastronomia', 'almacen', 'salud', 'hogar', 'servicios', 'tecnologia'] },
                  descripcion: { type: 'string' },
                  logo_url: { type: 'string' },
                  banner_url: { type: 'string' },
                  horarios: { type: 'object' },
                  activo: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Local creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Local' } } } },
          400: { description: 'Datos inválidos' },
        },
      },
    },
    '/locales/mias': {
      get: {
        tags: ['Locales'],
        summary: 'Listar mis locales',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**. Devuelve todos los locales que gestiona el usuario.',
        responses: {
          200: { description: 'Lista de locales', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Local' } } } } },
          401: { description: 'No autenticado' },
          403: { description: 'Sin permisos' },
        },
      },
    },
    '/locales/mine/mi-local': {
      get: {
        tags: ['Locales'],
        summary: 'Obtener mi local principal',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**. Devuelve el local asignado como principal.',
        responses: {
          200: { description: 'Mi local', content: { 'application/json': { schema: { $ref: '#/components/schemas/Local' } } } },
          404: { description: 'Sin local asignado' },
        },
      },
      patch: {
        tags: ['Locales'],
        summary: 'Actualizar mi local principal',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  nro_local: { type: 'string' },
                  rubro: { type: 'string', enum: ['gastronomia', 'almacen', 'salud', 'hogar', 'servicios', 'tecnologia'] },
                  descripcion: { type: 'string' },
                  logo_url: { type: 'string' },
                  banner_url: { type: 'string' },
                  horarios: { type: 'object' },
                  activo: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Local actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Local' } } } },
        },
      },
    },
    '/locales/{id}': {
      get: {
        tags: ['Locales'],
        summary: 'Obtener local por ID',
        description: 'Público. Inactivos solo visibles para admin o el local dueño.',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Local', content: { 'application/json': { schema: { $ref: '#/components/schemas/Local' } } } },
          404: { description: 'No encontrado' },
        },
      },
      patch: {
        tags: ['Locales'],
        summary: 'Actualizar local',
        security: [{ bearerAuth: [] }],
        description: 'Roles: **admin**, **local** (solo su propio local).',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  nro_local: { type: 'string' },
                  rubro: { type: 'string', enum: ['gastronomia', 'almacen', 'salud', 'hogar', 'servicios', 'tecnologia'] },
                  descripcion: { type: 'string' },
                  logo_url: { type: 'string' },
                  banner_url: { type: 'string' },
                  horarios: { type: 'object' },
                  activo: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Local actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Local' } } } },
          403: { description: 'No podés editar este local' },
          404: { description: 'No encontrado' },
        },
      },
      delete: {
        tags: ['Locales'],
        summary: 'Eliminar local',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Eliminado' },
          404: { description: 'No encontrado' },
        },
      },
    },

    // ── PROMOS ────────────────────────────────────────────────────────────────
    '/promos': {
      get: {
        tags: ['Promos'],
        summary: 'Listar promos',
        description: 'Público. Admins y locales pueden ver inactivas.',
        parameters: [
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'rubro', schema: { type: 'string', enum: ['gastronomia', 'almacen', 'salud', 'hogar', 'servicios', 'tecnologia'] } },
          { in: 'query', name: 'activa', schema: { type: 'boolean' } },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Promo' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Promos'],
        summary: 'Crear promo',
        security: [{ bearerAuth: [] }],
        description: 'Roles: **admin**, **local**. El local debe ser asignado al usuario si no es admin.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titulo', 'tipo', 'dias'],
                properties: {
                  local_id: { type: 'string', format: 'uuid', description: 'Requerido para admin; opcional para local (usa su local_id)' },
                  titulo: { type: 'string' },
                  tipo: { type: 'string', enum: ['2x1', '3x2', 'descuento', 'descuento_fijo', 'cuotas', 'combo', 'regalo', 'envio_gratis', 'bonificacion'] },
                  valor: { type: 'number', description: 'Requerido para tipos descuento/descuento_fijo/cuotas' },
                  precio_anterior: { type: 'number' },
                  precio_nuevo: { type: 'number' },
                  descripcion: { type: 'string' },
                  dias: { type: 'array', items: { type: 'string', enum: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] } },
                  vigencia_desde: { type: 'string', format: 'date' },
                  vigencia_hasta: { type: 'string', format: 'date' },
                  limite_cantidad: { type: 'integer' },
                  limite_periodo: { type: 'string', enum: ['dia', 'semana', 'mes', 'vigencia', 'ilimitado'], default: 'ilimitado' },
                  banner_url: { type: 'string' },
                  activa: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Promo creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Promo' } } } },
          400: { description: 'Datos inválidos' },
          403: { description: 'Sin permisos sobre el local' },
        },
      },
    },
    '/promos/mine/mis-promos': {
      get: {
        tags: ['Promos'],
        summary: 'Listar mis promos',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**. Filtra por el local del usuario autenticado.',
        parameters: [
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' }, description: 'Para multi-local' },
          { in: 'query', name: 'activa', schema: { type: 'boolean' } },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Promo' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Promos'],
        summary: 'Crear promo en mi local',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**. Equivalente a POST /promos pero sin necesitar pasar local_id.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titulo', 'tipo', 'dias'],
                properties: {
                  local_id: { type: 'string', format: 'uuid', description: 'Opcional para multi-local' },
                  titulo: { type: 'string' },
                  tipo: { type: 'string', enum: ['2x1', '3x2', 'descuento', 'descuento_fijo', 'cuotas', 'combo', 'regalo', 'envio_gratis', 'bonificacion'] },
                  valor: { type: 'number' },
                  precio_anterior: { type: 'number' },
                  precio_nuevo: { type: 'number' },
                  descripcion: { type: 'string' },
                  dias: { type: 'array', items: { type: 'string' } },
                  vigencia_desde: { type: 'string', format: 'date' },
                  vigencia_hasta: { type: 'string', format: 'date' },
                  limite_cantidad: { type: 'integer' },
                  limite_periodo: { type: 'string', enum: ['dia', 'semana', 'mes', 'vigencia', 'ilimitado'] },
                  banner_url: { type: 'string' },
                  activa: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Promo creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Promo' } } } },
          400: { description: 'Datos inválidos' },
        },
      },
    },
    '/promos/{id}': {
      get: {
        tags: ['Promos'],
        summary: 'Obtener promo por ID',
        description: 'Público. Inactivas solo visibles para admin o el local dueño.',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Promo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Promo' } } } },
          404: { description: 'No encontrada' },
        },
      },
      patch: {
        tags: ['Promos'],
        summary: 'Actualizar promo',
        security: [{ bearerAuth: [] }],
        description: 'Roles: **admin**, **local** (solo sus promos).',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  titulo: { type: 'string' },
                  tipo: { type: 'string', enum: ['2x1', '3x2', 'descuento', 'descuento_fijo', 'cuotas', 'combo', 'regalo', 'envio_gratis', 'bonificacion'] },
                  valor: { type: 'number' },
                  precio_anterior: { type: 'number' },
                  precio_nuevo: { type: 'number' },
                  descripcion: { type: 'string' },
                  dias: { type: 'array', items: { type: 'string' } },
                  vigencia_desde: { type: 'string', format: 'date' },
                  vigencia_hasta: { type: 'string', format: 'date' },
                  limite_cantidad: { type: 'integer' },
                  limite_periodo: { type: 'string', enum: ['dia', 'semana', 'mes', 'vigencia', 'ilimitado'] },
                  banner_url: { type: 'string' },
                  activa: { type: 'boolean' },
                  local_id: { type: 'string', format: 'uuid', description: 'Solo admin puede reasignar' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Promo actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Promo' } } } },
          403: { description: 'No podés gestionar esta promo' },
          404: { description: 'No encontrada' },
        },
      },
      delete: {
        tags: ['Promos'],
        summary: 'Eliminar promo',
        security: [{ bearerAuth: [] }],
        description: 'Roles: **admin**, **local** (solo sus promos).',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Eliminada' },
          403: { description: 'Sin permisos' },
          404: { description: 'No encontrada' },
        },
      },
    },

    // ── CANJES ────────────────────────────────────────────────────────────────
    '/canjes': {
      get: {
        tags: ['Canjes'],
        summary: 'Listar todos los canjes',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        parameters: [
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'promo_id', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'estado', schema: { type: 'string', enum: ['ok', 'rechazado', 'repetido'] } },
          { $ref: '#/components/parameters/desde' },
          { $ref: '#/components/parameters/hasta' },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Canje' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Canjes'],
        summary: 'Registrar canje',
        security: [{ bearerAuth: [] }],
        description: 'Roles: **admin**, **local**.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['promo_id'],
                properties: {
                  promo_id: { type: 'string', format: 'uuid' },
                  codigo: { type: 'string', description: 'Código del miembro (requerido si no se pasa usuario_id)' },
                  usuario_id: { type: 'string', format: 'uuid', description: 'Requerido si no se pasa codigo' },
                  local_id: { type: 'string', format: 'uuid', description: 'Para multi-local o admin' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Canje registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Canje' } } } },
          400: { description: 'Datos inválidos' },
          403: { description: 'Sin permisos' },
        },
      },
    },
    '/canjes/mine': {
      get: {
        tags: ['Canjes'],
        summary: 'Listar canjes de mi local',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**.',
        parameters: [
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' }, description: 'Para multi-local' },
          { in: 'query', name: 'estado', schema: { type: 'string', enum: ['ok', 'rechazado', 'repetido'] } },
          { $ref: '#/components/parameters/desde' },
          { $ref: '#/components/parameters/hasta' },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Canje' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/canjes/stats': {
      get: {
        tags: ['Canjes'],
        summary: 'Estadísticas globales de canjes',
        security: [{ bearerAuth: [] }],
        description: 'Solo **admin**.',
        parameters: [
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Stats', content: { 'application/json': { schema: { type: 'object' } } } },
        },
      },
    },
    '/canjes/stats/mine': {
      get: {
        tags: ['Canjes'],
        summary: 'Estadísticas de canjes de mi local',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**.',
        parameters: [
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' }, description: 'Para multi-local' },
        ],
        responses: {
          200: { description: 'Stats', content: { 'application/json': { schema: { type: 'object' } } } },
        },
      },
    },

    // ── ESCANEOS ──────────────────────────────────────────────────────────────
    '/escaneos/mine': {
      get: {
        tags: ['Escaneos'],
        summary: 'Listar escaneos de mi local',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**.',
        parameters: [
          { in: 'query', name: 'local_id', schema: { type: 'string', format: 'uuid' }, description: 'Para multi-local' },
          { $ref: '#/components/parameters/desde' },
          { $ref: '#/components/parameters/hasta' },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/offset' },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Escaneo' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/escaneos': {
      post: {
        tags: ['Escaneos'],
        summary: 'Registrar escaneo de QR',
        security: [{ bearerAuth: [] }],
        description: 'Solo **local**. Escanea el código QR de un miembro.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo'],
                properties: {
                  codigo: { type: 'string', description: 'Código del miembro' },
                  local_id: { type: 'string', format: 'uuid', description: 'Para multi-local' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Escaneo registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Escaneo' } } } },
          400: { description: 'codigo requerido' },
          403: { description: 'Sin permisos sobre el local' },
        },
      },
    },

    // ── UPLOAD ────────────────────────────────────────────────────────────────
    '/upload': {
      post: {
        tags: ['Upload'],
        summary: 'Subir imagen',
        security: [{ bearerAuth: [] }],
        description: 'Roles: **admin**, **local**. Sube logo o banner a Supabase Storage. Máx 2 MB.',
        parameters: [
          {
            in: 'query',
            name: 'tipo',
            required: true,
            schema: { type: 'string', enum: ['logo', 'banner'] },
            description: 'Tipo de imagen',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'URL de la imagen subida',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Archivo inválido o muy grande' },
          401: { description: 'No autenticado' },
        },
      },
    },
  },
}
