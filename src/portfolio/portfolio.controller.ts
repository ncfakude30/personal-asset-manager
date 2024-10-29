import { Controller, Get, Param, Req, UseGuards,} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { ApiTags} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Portfolio')
@Controller('portfolio')
@UseGuards(AuthGuard) // Applies the AuthGuard to all routes in this controller
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  async getPortfolio(@Req() req, @Param('userId') userId) {
    return this.portfolioService.calculatePortfolioValue(userId);
  }

  @Get('asset/:assetId/history')
  async getAssetHistory(@Req() req, @Param('assetId') assetId: string) {
    return this.portfolioService.getAssetHistory(assetId);
  }
}
