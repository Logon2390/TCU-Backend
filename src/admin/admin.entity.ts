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

  @Column({ type: 'varchar', length: 256, nullable: true })
  verifyCode: string | null;

  @Column({ type: 'datetime', nullable: true })
  accessCodeExpiry: Date | null;

  @Column({ type: 'datetime', nullable: true })
  verifyCodeExpiry: Date | null;

  @Column({ type: 'datetime', nullable: true })
  createdAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  updatedAt: Date | null;
}
