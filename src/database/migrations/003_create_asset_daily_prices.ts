// src/database/migrations/003_create_asset_daily_prices_table.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('asset_daily_prices')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo('uuid_generate_v4()'),
    )
    .addColumn('asset_id', 'uuid', (col) =>
      col.references('assets.id').notNull(),
    )
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('price', 'decimal', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('asset_daily_prices').execute();
}
