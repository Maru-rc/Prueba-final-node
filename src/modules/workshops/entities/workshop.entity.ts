import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Maintenance } from '../../maintenances/entities/maintenance.entity';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, unique: true })
  name: string;

  @Column({ length: 200 })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.workshop)
  maintenances: Maintenance[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
