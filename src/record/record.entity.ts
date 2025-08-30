import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ModuleEntity } from '../module/module.entity';

@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_record_user_id')
  user: User;

  @ManyToOne(() => ModuleEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  @Index('idx_record_module_id')
  module: ModuleEntity;

  @Column({ type: 'datetime' })
  @Index('idx_record_visited_at')
  visitedAt: Date;
}
