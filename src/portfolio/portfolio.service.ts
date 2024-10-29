// src/portfolio/portfolio.service.ts
import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Kysely } from 'kysely';
import { AssetDailyPrice } from '../database/types';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class PortfolioService {
  constructor(
    @Inject('KYSLEY_DB') private db: Kysely<any>,
    private readonly metrics: MetricsService,
  ) {}

  async calculatePortfolioValue(
    userId: string,
  ): Promise<{ totalValue: number }> {
    try {
      this.metrics.increment('portfolio.calculate_portfolio_value.count');
      const assets = await this.db
        .selectFrom('assets')
        .selectAll()
        .where('user_id', '=', userId)
        .execute();

      let totalValue = 0;

      for (const asset of assets) {
        const latestPrice = await this.db
          .selectFrom('asset_daily_price')
          .selectAll()
          .where('asset_id', '=', asset.id)
          .orderBy('date', 'desc')
          .limit(1)
          .executeTakeFirst();

        if (latestPrice) {
          totalValue += latestPrice.price * (asset.quantity || 1);
        }
      }

      this.metrics.increment('portfolio.calculate_portfolio_value.success');
      return { totalValue };
    } catch (error: any) {
      this.metrics.increment('portfolio.calculate_portfolio_value.failure');
      throw new InternalServerErrorException(
        'Failed to calculate portfolio value',
      );
    }
  }

  async getAssetHistory(assetId: string): Promise<AssetDailyPrice[]> {
    try {
      this.metrics.increment('portfolio.get_asset_history.count');

      //TODO: get from redis if caching is required before the DB

      const history = await this.db
        .selectFrom('asset_daily_price')
        .selectAll()
        .where('asset_id', '=', assetId)
        .execute();

      // Map the results to ensure they conform to the AssetDailyPrice type
      this.metrics.increment('portfolio.get_asset_history.success');
      return history.map((record) => ({
        asset_id: record.asset_id,
        date: record.date,
        price: record.price,
      })) as AssetDailyPrice[];
    } catch (error) {
      this.metrics.increment('portfolio.get_asset_history.failure');
      throw new InternalServerErrorException('Failed to fetch asset history');
    }
  }
}
