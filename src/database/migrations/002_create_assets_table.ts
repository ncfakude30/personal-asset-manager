// src/database/migrations/002_create_assets_table.ts
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('assets')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo('uuid_generate_v4()'),
    )
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').notNull())
    .addColumn('type', 'varchar', (col) => col.notNull())
    .addColumn('smart_contract_address', 'varchar', (col) => col.notNull())
    .addColumn('chain', 'varchar', (col) => col.notNull())
    .addColumn('quantity', 'integer')
    .addColumn('token_id', 'varchar')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('assets').execute();
}
