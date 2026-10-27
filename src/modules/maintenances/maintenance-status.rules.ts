import { BadRequestException, ConflictException } from '@nestjs/common';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { MaintenanceStatus } from './enums/maintenance-status.enum';

/**
 * Reglas de negocio del ciclo de vida de un mantenimiento.
 * Son funciones puras (no tocan la base de datos) para poder leerlas y probarlas aisladas.
 */

const { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED } = MaintenanceStatus;

/** Transiciones permitidas. COMPLETED y CANCELLED son estados finales. */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<MaintenanceStatus, readonly MaintenanceStatus[]>
> = {
  [SCHEDULED]: [IN_PROGRESS, CANCELLED],
  [IN_PROGRESS]: [COMPLETED, CANCELLED],
  [COMPLETED]: [],
  [CANCELLED]: [],
};

/** Lanza 409 con un mensaje descriptivo si la transición no está permitida. */
export function assertValidTransition(
  from: MaintenanceStatus,
  to: MaintenanceStatus,
): void {
  if (from === to) {
    throw new ConflictException(`El mantenimiento ya está en estado ${to}`);
  }
  if (from === COMPLETED) {
    throw new ConflictException(
      `Un mantenimiento COMPLETED no puede regresar a ${to}: es un estado final`,
    );
  }
  if (from === CANCELLED) {
    throw new ConflictException(
      `Un mantenimiento CANCELLED no puede cambiar a ${to}: es un estado final`,
    );
  }
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(
      `Transición inválida de ${from} a ${to}. Desde ${from} solo se permite: ${ALLOWED_TRANSITIONS[from].join(', ')}`,
    );
  }
}

/** Estado que debe tomar el vehículo después de la transición; null si no cambia. */
export function vehicleStatusAfterTransition(
  from: MaintenanceStatus,
  to: MaintenanceStatus,
): VehicleStatus | null {
  if (to === IN_PROGRESS) return VehicleStatus.IN_MAINTENANCE;
  if (to === COMPLETED) return VehicleStatus.AVAILABLE;
  // Cancelar uno en curso libera el vehículo; cancelar uno programado no lo afecta
  if (to === CANCELLED && from === IN_PROGRESS) return VehicleStatus.AVAILABLE;
  return null;
}

export interface ClosingData {
  workPerformed?: string;
  finalCost?: number;
  finishedAt?: string;
  finalMileage?: number;
}

const CLOSING_FIELDS = [
  'workPerformed',
  'finalCost',
  'finishedAt',
  'finalMileage',
] as const;

/** Lanza 400 indicando qué datos de cierre faltan para poder completar el mantenimiento. */
export function assertClosingData(
  data: ClosingData,
): asserts data is Required<ClosingData> {
  const missing = CLOSING_FIELDS.filter(
    (field) => data[field] === undefined || data[field] === null,
  );
  if (missing.length > 0) {
    throw new BadRequestException(
      `Para completar el mantenimiento faltan los datos de cierre: ${missing.join(', ')}`,
    );
  }
}

/**
 * Dos franjas [inicio, fin) se cruzan si cada una empieza antes de que termine la otra.
 * Una que termina a las 9:00 y otra que empieza a las 9:00 NO se cruzan.
 */
export function schedulesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}
