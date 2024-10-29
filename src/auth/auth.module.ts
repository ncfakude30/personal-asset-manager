import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MetricsService } from '../metrics/metrics.service';

@Module({
  providers: [AuthService, MetricsService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
