// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import jwt_decode from 'jwt-decode';
import * as jwt from 'jsonwebtoken';
import { MetricsService } from '../metrics/metrics.service';

interface DecodedToken {
  userId: string; 
  exp: number;    
  iat: number;
}

@Injectable()
export class AuthService {
  constructor(private readonly metrics: MetricsService) {}

  validatePrivyToken(privyJwt: string): boolean {
    try {
      this.metrics.increment('auth.validate_privy_token.count');
      const decoded = jwt_decode<DecodedToken>(privyJwt);

      if (!decoded || !decoded.userId) {
        this.metrics.increment('auth.validate_privy_token.invalid_token');
        throw new UnauthorizedException('Invalid token: User ID is missing');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        this.metrics.increment('auth.validate_privy_token.expired_token');
        throw new UnauthorizedException('Token has expired');
      }

      this.metrics.increment('auth.validate_privy_token.success');
      return true; // Token is valid
    } catch (error: any) {
        this.metrics.increment('auth.validate_privy_token.failure');
      throw new UnauthorizedException(`Invalid token: ${error?.message}`, error);
    }
  }

  extractUserIdFromToken(privyJwt: string): string | null {
    try {
      const decoded = jwt_decode<DecodedToken>(privyJwt);
      return decoded.userId || null;
    } catch (error) {
      this.metrics.increment('extraction_errors'); // Log extraction error
      throw new UnauthorizedException('Failed to extract user ID from token');
    }
  }

  generateMetaversalJwt(userId: string): string {
    const secretKey = process.env.PRIVY_SECRET_KEY;
    if (!secretKey) {
      throw new InternalServerErrorException('Secret key is not defined in environment variables');
    }

    const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
    this.metrics.increment('generated_tokens'); // Log generated tokens
    return token;
  }
}
