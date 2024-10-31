import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { authConfig } from '../config/auth.config';
import { ConfigType } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let metricsService: MetricsService;

  const mockAuthConfig: ConfigType<typeof authConfig> = {
    secretKey: 'testSecretKey',
    expiresIn: '1h',
  };

  const mockMetricsService = {
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: authConfig.KEY, useValue: mockAuthConfig },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePrivyToken', () => {
    it('should validate a valid token', () => {
      const mockToken = 'validToken';
      const decodedToken = {
        userId: '123',
        exp: Math.floor(Date.now() / 1000) + 1000,
        iat: Date.now() / 1000,
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken);
      const result = service.validatePrivyToken(mockToken);

      expect(result).toBe(true);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'auth.validate_privy_token.success',
      );
    });

    it('should throw UnauthorizedException if token is expired', () => {
      const mockToken = 'expiredToken';
      const decodedToken = {
        userId: '123',
        exp: Math.floor(Date.now() / 1000) - 1000,
        iat: Date.now() / 1000,
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken);

      expect(() => service.validatePrivyToken(mockToken)).toThrow(
        UnauthorizedException,
      );
      expect(metricsService.increment).toHaveBeenCalledWith(
        'auth.validate_privy_token.expired_token',
      );
    });

    it('should throw UnauthorizedException if token is missing userId', () => {
      const mockToken = 'invalidToken';
      const decodedToken = {
        exp: Math.floor(Date.now() / 1000) + 1000,
        iat: Date.now() / 1000,
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken);

      expect(() => service.validatePrivyToken(mockToken)).toThrow(
        UnauthorizedException,
      );
      expect(metricsService.increment).toHaveBeenCalledWith(
        'auth.validate_privy_token.invalid_token',
      );
    });
  });

  describe('extractUserIdFromToken', () => {
    it('should return userId from a valid token', () => {
      const mockToken = 'validToken';
      const decodedToken = {
        userId: '123',
        exp: Math.floor(Date.now() / 1000) + 1000,
        iat: Date.now() / 1000,
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken);

      const result = service.extractUserIdFromToken(mockToken);
      expect(result).toBe('123');
    });

    it('should throw UnauthorizedException if extraction fails', () => {
      (jwt_decode as jest.Mock).mockImplementation(() => {
        throw new Error('Decoding error');
      });

      expect(() => service.extractUserIdFromToken('invalidToken')).toThrow(
        UnauthorizedException,
      );
      expect(metricsService.increment).toHaveBeenCalledWith(
        'extraction_errors',
      );
    });
  });

  describe('generateMetaversalJwt', () => {
    it('should generate a JWT with a given userId', () => {
      const mockUserId = '123';
      const mockToken = 'generatedToken';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = service.generateMetaversalJwt(mockUserId);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        mockAuthConfig.secretKey,
        { expiresIn: mockAuthConfig.expiresIn },
      );
      expect(metricsService.increment).toHaveBeenCalledWith('generated_tokens');
    });

    it('should throw InternalServerErrorException if secretKey is missing', () => {
      const serviceWithoutSecret = new AuthService(
        { ...mockAuthConfig, secretKey: '' },
        mockMetricsService as any,
      );

      expect(() => serviceWithoutSecret.generateMetaversalJwt('123')).toThrow(
        InternalServerErrorException,
      );
    });
  });
});
