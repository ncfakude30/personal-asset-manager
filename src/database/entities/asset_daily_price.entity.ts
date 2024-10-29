// src/database/entities/asset_daily_price.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Asset } from './asset.entity';

@Entity('asset_daily_prices')
export class AssetDailyPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column('decimal')
  price: number;

  @ManyToOne(() => Asset, (asset) => asset.dailyPrices)
  asset: Asset;
}
