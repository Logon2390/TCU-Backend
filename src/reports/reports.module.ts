import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { User } from '../user/user.entity';
import { Record } from '../record/record.entity';
import { ModuleEntity } from '../module/module.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Record, User, ModuleEntity]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

