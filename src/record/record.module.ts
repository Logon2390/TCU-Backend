import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Record } from './record.entity';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { User } from '../user/user.entity';
import { ModuleEntity } from '../module/module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Record, User, ModuleEntity])],
  controllers: [RecordController],
  providers: [RecordService],
})
export class RecordModule {}
