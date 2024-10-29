import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AssetsModule } from './assets/assets.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { MetricsModule } from './metrics/metrics.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard'; 

@Module({
  imports: [AuthModule, AssetsModule, PortfolioModule, MetricsModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Apply AuthGuard globally
    },
  ],
})
export class AppModule {}
