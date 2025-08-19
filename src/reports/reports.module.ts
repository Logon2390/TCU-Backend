import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Stats } from '../stats/stats.entity';
import { User } from '../user/user.entity';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stats, User]),
    StatsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

