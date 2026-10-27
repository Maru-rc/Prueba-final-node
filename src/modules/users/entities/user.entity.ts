import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 150, unique: true })
  email: string;

  // select: false: el hash no se incluye en las consultas, salvo que se pida explícitamente
  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.TECHNICIAN })
  role: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
