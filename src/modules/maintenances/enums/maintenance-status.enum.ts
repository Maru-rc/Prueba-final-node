export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** Un mantenimiento "activo" ocupa al vehículo y al mecánico. */
export const ACTIVE_MAINTENANCE_STATUSES = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];
