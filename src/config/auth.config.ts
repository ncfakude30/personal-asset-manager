import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('authConfig', () => ({
  secretKey: process.env.PRIVY_SECRET_KEY,
  expiresIn: process.env.METAVERSAL_JWT_EXPIRY || '1h',
}));
