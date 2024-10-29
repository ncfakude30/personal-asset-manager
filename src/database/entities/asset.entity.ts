import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { AssetDailyPrice } from './asset_daily_price.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  smartContractAddress: string;

  @Column()
  chain: string;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  tokenId: string;

  @ManyToOne(() => User, (user) => user.assets)
  user: User;

  @OneToMany(() => AssetDailyPrice, (price) => price.asset)
  dailyPrices: AssetDailyPrice[];
}
