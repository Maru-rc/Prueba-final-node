import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Mechanic } from '../../mechanics/entities/mechanic.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Workshop } from '../../workshops/entities/workshop.entity';
import { MaintenanceStatus } from '../enums/maintenance-status.enum';
import { MaintenanceType } from '../enums/maintenance-type.enum';
import { MaintenanceStatusLog } from './maintenance-status-log.entity';

@Entity('maintenances')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  // Kilometraje del vehículo al ingresar al mantenimiento
  @Column({ type: 'int' })
  mileage: number;

  // Franja programada [scheduledAt, estimatedEndAt): se usa para evitar cruces de horario del mecánico
  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'timestamptz' })
  estimatedEndAt: Date;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  // Datos de cierre: obligatorios para pasar a COMPLETED
  @Column({ type: 'text', nullable: true })
  workPerformed: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  finalCost: number | null;

  @Column({ type: 'int', nullable: true })
  finalMileage: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  // RESTRICT: no se puede borrar un vehículo, mecánico o taller con mantenimientos (se inactivan)
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenances, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column()
  vehicleId: number;

  @ManyToOne(() => Mechanic, (mechanic) => mechanic.maintenances, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'mechanicId' })
  mechanic: Mechanic;

  @Column()
  mechanicId: number;

  @ManyToOne(() => Workshop, (workshop) => workshop.maintenances, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'workshopId' })
  workshop: Workshop;

  @Column()
  workshopId: number;

  @OneToMany(() => MaintenanceStatusLog, (log) => log.maintenance)
  statusLogs: MaintenanceStatusLog[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
