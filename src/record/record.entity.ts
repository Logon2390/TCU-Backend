import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ModuleEntity } from '../module/module.entity';

@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ModuleEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: ModuleEntity;

  @Column({ type: 'date' })
  date: Date;
}
