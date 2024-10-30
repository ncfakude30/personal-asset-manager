import { Inject, Injectable, Logger } from '@nestjs/common';
import { redisConfig } from '../config/redis.config';
import { createClient, RedisClientType, RedisModules } from 'redis';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class RedisService {
  protected client: RedisClientType<RedisModules, any>;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>,
    private readonly logger: Logger,
  ) {
    this.client = this.createConnection(this.config.redisUrl);
    this.registerEventHandlers();
  }

  private createConnection(
    redisUrl: string,
  ): RedisClientType<RedisModules, any> {
    const client = createClient({
      url: redisUrl,
    });

    client.connect().catch((err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
    return client as any;
  }

  private registerEventHandlers(): void {
    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn(`Redis reconnecting...`);
    });

    this.client.on('connect', () => {
      this.logger.log(`Redis connected successfully`);
    });
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err: any) {
      this.logger.error(`Failed to get key ${key}: ${err?.message}`);
      throw err;
    }
  }

  async set(key: string, value: any, expireInSeconds?: number): Promise<void> {
    try {
      const valueString = JSON.stringify(value);
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, valueString);
      } else {
        await this.client.set(key, valueString);
      }
    } catch (err: any) {
      this.logger.error(`Failed to set key ${key}: ${err?.message}`);
      throw err;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.error(`Failed to delete key ${key}: ${err?.message}`);
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err: any) {
      this.logger.error(
        `Failed to check existence of key ${key}: ${err.message}`,
      );
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log(`Redis client disconnected successfully`);
    } catch (err: any) {
      this.logger.error(`Failed to disconnect Redis client: ${err.message}`);
      throw err;
    }
  }
}
