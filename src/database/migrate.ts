// src/database/migrate.ts
import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from './database.module'; // Adjust the import path as necessary
import { Kysely, PostgresDialect } from 'kysely';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { readdirSync } from 'fs'; // Import the necessary function from fs

async function runMigrations() {
  const appContext = await NestFactory.createApplicationContext(DatabaseModule);
  const configService = appContext.get(ConfigService);

  // Create a Kysely instance
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: configService.get('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        database: configService.get('POSTGRES_DB'),
        user: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
      }),
    }),
  });

  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.ts')) // Change to '.js' if compiled
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    await db.destroy(); // Close the database connection
    await appContext.close(); // Close the NestJS application context
    return;
  }

  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = await import(migrationPath);
    console.log(`Running migration: ${file}`);
    try {
      await migration.up(db);
      console.log(`Successfully ran migration: ${file}`);
    } catch (error) {
      console.error(`Error running migration ${file}:`, error);
      await db.destroy(); // Ensure database connection is closed before exiting
      await appContext.close(); // Close the NestJS application context
      process.exit(1);
    }
  }

  await db.destroy(); // Close the database connection
  await appContext.close(); // Close the NestJS application context
}

runMigrations()
  .then(() => console.log('All migrations completed successfully.'))
  .catch((error) => {
    console.error('Migration runner failed:', error);
    process.exit(1);
  });
