import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { DatabaseModule } from '../database/database.module';
import { MetricsService } from '../metrics/metrics.service';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [DatabaseModule],
  providers: [AssetsService, MetricsService, AuthService],
  controllers: [AssetsController],
})
export class AssetsModule {}
