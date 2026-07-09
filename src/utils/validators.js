import { AppError } from './AppError.js'
import { RUBROS, TIPOS_BENEFICIO, LIMITE_PERIODO } from '../constants/enums.js'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const TIPOS_REQUIEREN_VALOR = ['descuento', 'cuotas']

export function validateRubro(rubro) {
  if (!rubro) throw new AppError('rubro es requerido', 400)
  if (!RUBROS.includes(rubro)) {
    throw new AppError(`rubro inválido. Opciones: ${RUBROS.join(', ')}`, 400)
  }
}

export function validateHorarios(horarios) {
  if (horarios == null) return

  if (!Array.isArray(horarios)) {
    throw new AppError('horarios debe ser un array', 400)
  }

  const seenDays = new Set()

  for (const entry of horarios) {
    if (typeof entry !== 'object' || entry === null) {
      throw new AppError('Cada entrada de horarios debe ser un objeto', 400)
    }

    const { dia, cerrado, rangos } = entry

    if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
      throw new AppError('horarios.dia debe ser un entero entre 0 y 6', 400)
    }

    if (seenDays.has(dia)) {
      throw new AppError(`horarios tiene el día ${dia} duplicado`, 400)
    }
    seenDays.add(dia)

    if (typeof cerrado !== 'boolean') {
      throw new AppError('horarios.cerrado debe ser boolean', 400)
    }

    if (!Array.isArray(rangos)) {
      throw new AppError('horarios.rangos debe ser un array', 400)
    }

    if (cerrado) {
      if (rangos.length > 0) {
        throw new AppError('horarios.rangos debe estar vacío cuando cerrado es true', 400)
      }
      continue
    }

    if (rangos.length === 0) {
      throw new AppError('horarios.rangos debe tener al menos un rango cuando no está cerrado', 400)
    }

    for (const rango of rangos) {
      if (!Array.isArray(rango) || rango.length !== 2) {
        throw new AppError('Cada rango debe ser un par ["HH:MM","HH:MM"]', 400)
      }

      const [desde, hasta] = rango
      if (!TIME_RE.test(desde) || !TIME_RE.test(hasta)) {
        throw new AppError('Los horarios deben usar formato 24h HH:MM', 400)
      }

      if (desde >= hasta) {
        throw new AppError('El inicio del rango debe ser anterior al fin', 400)
      }
    }
  }
}

export function validateDias(dias) {
  if (!dias || !Array.isArray(dias) || dias.length === 0) {
    throw new AppError('dias es requerido (al menos un día)', 400)
  }

  const seen = new Set()

  for (const dia of dias) {
    if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
      throw new AppError('dias debe contener enteros entre 0 y 6', 400)
    }
    if (seen.has(dia)) {
      throw new AppError(`dias tiene el día ${dia} duplicado`, 400)
    }
    seen.add(dia)
  }
}

export function validateVigencia(vigencia_desde, vigencia_hasta) {
  if (!vigencia_desde || !vigencia_hasta) {
    throw new AppError('vigencia_desde y vigencia_hasta son requeridas', 400)
  }

  if (!DATE_RE.test(vigencia_desde) || !DATE_RE.test(vigencia_hasta)) {
    throw new AppError('vigencia_desde y vigencia_hasta deben tener formato YYYY-MM-DD', 400)
  }

  if (vigencia_hasta < vigencia_desde) {
    throw new AppError('vigencia_hasta debe ser igual o posterior a vigencia_desde', 400)
  }
}

export function validatePromoFields({
  tipo,
  valor,
  precio_anterior,
  precio_nuevo,
  dias,
  vigencia_desde,
  vigencia_hasta,
  limite_cantidad,
  limite_periodo,
}) {
  if (!tipo) throw new AppError('tipo es requerido', 400)
  if (!TIPOS_BENEFICIO.includes(tipo)) {
    throw new AppError(`tipo inválido. Opciones: ${TIPOS_BENEFICIO.join(', ')}`, 400)
  }

  if (tipo === 'descuento_fijo') {
    if (!precio_anterior || precio_anterior <= 0) {
      throw new AppError('precio_anterior es requerido y debe ser mayor a 0 para el tipo "descuento_fijo"', 400)
    }
    if (!precio_nuevo || precio_nuevo <= 0) {
      throw new AppError('precio_nuevo es requerido y debe ser mayor a 0 para el tipo "descuento_fijo"', 400)
    }
    if (precio_nuevo >= precio_anterior) {
      throw new AppError('precio_nuevo debe ser menor que precio_anterior', 400)
    }
  }

  if (TIPOS_REQUIEREN_VALOR.includes(tipo) && (valor === undefined || valor === null)) {
    throw new AppError(`valor es requerido para el tipo "${tipo}"`, 400)
  }

  validateDias(dias)
  validateVigencia(vigencia_desde, vigencia_hasta)

  if (limite_cantidad != null) {
    if (!Number.isInteger(limite_cantidad) || limite_cantidad < 1) {
      throw new AppError('limite_cantidad debe ser un entero positivo', 400)
    }
    if (!limite_periodo) {
      throw new AppError('limite_periodo es requerido cuando se define limite_cantidad', 400)
    }
  }

  if (limite_periodo && !LIMITE_PERIODO.includes(limite_periodo)) {
    throw new AppError(`limite_periodo inválido. Opciones: ${LIMITE_PERIODO.join(', ')}`, 400)
  }
}
