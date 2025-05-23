import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  document: string;

  @Column({ type: 'enum', enum: ['F', 'M', 'O'] })
  gender: 'F' | 'M' | 'O';

  @Column({ type: 'date', nullable: true })
  birthday: Date;

  @Column({ type: 'date', nullable: true })
  lastRecord: Date;
}
