import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MaintenanceStatus } from '../enums/maintenance-status.enum';
import { Maintenance } from './maintenance.entity';

/** Auditoría: un registro por cada cambio de estado de un mantenimiento. */
@Entity('maintenance_status_logs')
export class MaintenanceStatusLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Maintenance, (maintenance) => maintenance.statusLogs, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'maintenanceId' })
  maintenance: Maintenance;

  @Column()
  maintenanceId: number;

  // null en el registro de creación (no había estado anterior)
  @Column({ type: 'enum', enum: MaintenanceStatus, nullable: true })
  fromStatus: MaintenanceStatus | null;

  @Column({ type: 'enum', enum: MaintenanceStatus })
  toStatus: MaintenanceStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedById' })
  changedBy: User | null;

  @Column({ type: 'int', nullable: true })
  changedById: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  changedAt: Date;
}
