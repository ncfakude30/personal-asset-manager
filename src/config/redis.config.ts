import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redisConfig', () => ({
  redisUrl: process.env.REDIS_URL,
}));
