import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { DatabaseModule } from '../database/database.module';
import { MetricsService } from '../metrics/metrics.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service'


@Module({
    imports: [DatabaseModule],
  providers: [PortfolioService, MetricsService, AuthService, AuthGuard],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
