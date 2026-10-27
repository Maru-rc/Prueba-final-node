import { BadRequestException, ConflictException } from '@nestjs/common';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { MaintenanceStatus } from './enums/maintenance-status.enum';
import {
  assertClosingData,
  assertValidTransition,
  schedulesOverlap,
  vehicleStatusAfterTransition,
} from './maintenance-status.rules';

const { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED } = MaintenanceStatus;

describe('maintenance-status.rules', () => {
  describe('assertValidTransition', () => {
    it.each([
      [SCHEDULED, IN_PROGRESS],
      [SCHEDULED, CANCELLED],
      [IN_PROGRESS, COMPLETED],
      [IN_PROGRESS, CANCELLED],
    ])('permite %s -> %s', (from, to) => {
      expect(() => assertValidTransition(from, to)).not.toThrow();
    });

    it.each([
      [COMPLETED, SCHEDULED],
      [COMPLETED, IN_PROGRESS],
      [COMPLETED, CANCELLED],
    ])('un COMPLETED no puede regresar: %s -> %s', (from, to) => {
      expect(() => assertValidTransition(from, to)).toThrow(
        /COMPLETED no puede regresar/,
      );
    });

    it.each([
      [CANCELLED, IN_PROGRESS],
      [CANCELLED, COMPLETED],
    ])('un CANCELLED no puede pasar a %s -> %s', (from, to) => {
      expect(() => assertValidTransition(from, to)).toThrow(
        /CANCELLED no puede cambiar/,
      );
    });

    it('no permite completar sin haber iniciado (SCHEDULED -> COMPLETED)', () => {
      expect(() => assertValidTransition(SCHEDULED, COMPLETED)).toThrow(
        ConflictException,
      );
    });

    it('no permite volver de IN_PROGRESS a SCHEDULED', () => {
      expect(() => assertValidTransition(IN_PROGRESS, SCHEDULED)).toThrow(
        /solo se permite: COMPLETED, CANCELLED/,
      );
    });

    it('rechaza cambiar al mismo estado', () => {
      expect(() => assertValidTransition(SCHEDULED, SCHEDULED)).toThrow(
        /ya está en estado SCHEDULED/,
      );
    });
  });

  describe('vehicleStatusAfterTransition', () => {
    it('IN_PROGRESS deja el vehículo IN_MAINTENANCE', () => {
      expect(vehicleStatusAfterTransition(SCHEDULED, IN_PROGRESS)).toBe(
        VehicleStatus.IN_MAINTENANCE,
      );
    });

    it('COMPLETED deja el vehículo AVAILABLE', () => {
      expect(vehicleStatusAfterTransition(IN_PROGRESS, COMPLETED)).toBe(
        VehicleStatus.AVAILABLE,
      );
    });

    it('cancelar uno en curso libera el vehículo', () => {
      expect(vehicleStatusAfterTransition(IN_PROGRESS, CANCELLED)).toBe(
        VehicleStatus.AVAILABLE,
      );
    });

    it('cancelar uno programado no cambia el vehículo', () => {
      expect(vehicleStatusAfterTransition(SCHEDULED, CANCELLED)).toBeNull();
    });
  });

  describe('assertClosingData', () => {
    it('lista todos los datos de cierre que faltan', () => {
      expect(() => assertClosingData({ finalCost: 1000 })).toThrow(
        new BadRequestException(
          'Para completar el mantenimiento faltan los datos de cierre: workPerformed, finishedAt, finalMileage',
        ),
      );
    });

    it('acepta costo 0 como dato válido', () => {
      expect(() =>
        assertClosingData({
          workPerformed: 'Revisión sin costo por garantía',
          finalCost: 0,
          finishedAt: '2026-10-28T09:00:00-05:00',
          finalMileage: 1000,
        }),
      ).not.toThrow();
    });
  });

  describe('schedulesOverlap (ejemplos del enunciado)', () => {
    const at = (time: string) => new Date(`2026-10-28T${time}:00-05:00`);

    it('a/b. dos mantenimientos a las 7:30 se cruzan', () => {
      expect(
        schedulesOverlap(at('07:30'), at('09:00'), at('07:30'), at('08:30')),
      ).toBe(true);
    });

    it('c. 7:30-9:00 se cruza con uno que inicia a las 8:00', () => {
      expect(
        schedulesOverlap(at('07:30'), at('09:00'), at('08:00'), at('10:00')),
      ).toBe(true);
    });

    it('d. 7:30-9:00 NO se cruza con uno que inicia a las 9:00', () => {
      expect(
        schedulesOverlap(at('07:30'), at('09:00'), at('09:00'), at('10:00')),
      ).toBe(false);
    });

    it('una franja contenida dentro de otra se cruza', () => {
      expect(
        schedulesOverlap(at('07:00'), at('12:00'), at('08:00'), at('09:00')),
      ).toBe(true);
    });
  });
});
