import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ModuleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 256 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  createdAt: Date | null;
}
