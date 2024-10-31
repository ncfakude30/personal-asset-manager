import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Asset } from '../database/types';
import { MetricsService } from '../metrics/metrics.service';
import { CreateAssetDto } from './dto/assets.dto';

@Injectable()
export class AssetsService {
  constructor(
    @Inject('KYSLEY_DB') private db: Kysely<any>,
    private metrics: MetricsService,
  ) {}

  async addAsset(userId: string, assetData: CreateAssetDto): Promise<Asset> {
    try {
      this.metrics.increment('assets.add_asset.count');
      const [newAsset] = await this.db
        .insertInto('assets')
        .values({
          ...assetData,
          user_id: userId,
        })
        .returningAll()
        .execute();

      this.metrics.increment('assets.add_asset.success');
      return newAsset as Asset;
    } catch (error) {
      console.log(error);
      this.metrics.increment('assets.add_asset.failure');
      throw new Error('Could not add asset');
    }
  }

  async removeAsset(userId: string, assetId: string): Promise<void> {
    const assetExists = await this.db
      .selectFrom('assets')
      .select('id')
      .where('id', '=', assetId)
      .where('user_id', '=', userId)
      .execute();

    if (assetExists.length === 0) {
      throw new Error('Asset not found or not owned by user');
    }

    await this.db
      .deleteFrom('assets')
      .where('id', '=', assetId)
      .where('user_id', '=', userId)
      .execute();

    this.metrics.decrement('assets_removed'); // Make sure this is correctly defined in your MetricsService
  }

  async listAssets(userId: string): Promise<Asset[]> {
    const assets = await this.db
      .selectFrom('assets')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();

    return assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      user_id: asset.user_id,
    })) as Asset[];
  }
}
