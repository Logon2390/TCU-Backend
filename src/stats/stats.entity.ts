import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Stats {
  // id de la visita
  @PrimaryGeneratedColumn()
  id: number;

  // Fecha y hora de entrada/salida completas para poder filtrar por rangos exactos
  @Column({ type: 'timestamp' })
  entryDateTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  exitDateTime: Date;

  // Género: Femenino, Masculino, Otro
  @Column({ type: 'enum', enum: ['F', 'M', 'O'] })
  gender: 'F' | 'M' | 'O';

  // Edad del usuario al momento de la visita
  @Column({ type: 'int' })
  age: number;

  // Relación opcional con usuario registrado
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  // notas extras
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Estado de la visita
  @Column({ type: 'enum', enum: ['registrada', 'anulada'], default: 'registrada' })
  status: 'registrada' | 'anulada';

  // Campos para reportes por año/mes
  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  // manejo de fechas
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
