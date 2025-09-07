import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 320, unique: true })
  email: string;

  @Column({ length: 256 })
  password: string;

  @Column({ type: 'enum', enum: ['M', 'A'] })
  role: 'M' | 'A';

  @Column({ type: 'varchar', length: 256, nullable: true })
  accessCode: string | null;

  @Column({ type: 'datetime', nullable: true })
  accessCodeExpiry: Date | null;
}
