// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Asset } from './entities/asset.entity';
import { AssetDailyPrice } from './entities/asset_daily_price.entity';
import { Database } from './types';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: +configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [User, Asset, AssetDailyPrice],
        synchronize: true, // For dev only. In production, use migrations/<subjective>
      }),
    }),
  ],
  providers: [
    {
      provide: 'KYSLEY_DB',
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get('POSTGRES_HOST'),
          port: +configService.get('POSTGRES_PORT'),
          database: configService.get('POSTGRES_DB'),
          user: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          max: 10,
        });

        // Instantiate the dialect
        const dialect = new PostgresDialect({ pool });

        // Create the Kysely instance with your database interface
        return new Kysely<Database>({
          dialect,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['KYSLEY_DB'], // Export Kysely instance for use in other modules
})
export class DatabaseModule {}
