import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ModuleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 256 })
  name: string;
}
