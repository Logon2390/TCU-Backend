import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  document: string;

  @Column({ type: 'enum', enum: ['F', 'M', 'O'] })
  @Index('idx_user_gender')
  gender: 'F' | 'M' | 'O';

  @Column({ type: 'date', nullable: true })
  @Index('idx_user_birthday')
  birthday: Date;

  @Column({ type: 'datetime', nullable: true })
  lastRecord: Date;
}
