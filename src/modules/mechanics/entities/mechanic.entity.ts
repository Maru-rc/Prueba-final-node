import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 80 })
  specialty: string;

  @Column({ default: true })
  isActive: boolean;

  // Usuario TECHNICIAN con el que el mecánico inicia sesión y ve sus mantenimientos (opcional)
  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
