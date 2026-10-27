import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Maintenance } from '../../maintenances/entities/maintenance.entity';
import { VehicleStatus } from '../enums/vehicle-status.enum';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10, unique: true })
  plate: string;

  @Column({ length: 60 })
  brand: string;

  @Column({ length: 60 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 0 })
  mileage: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.vehicle)
  maintenances: Maintenance[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
