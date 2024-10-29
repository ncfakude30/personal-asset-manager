// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import jwt_decode from 'jwt-decode';
import * as jwt from 'jsonwebtoken';
import { MetricsService } from '../metrics/metrics.service';

jest.mock('jsonwebtoken'); // Mock the jsonwebtoken module
jest.mock('jwt-decode'); // Mock the jwt-decode module

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: MetricsService, useValue: {} }], // Mock MetricsService if needed
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('validatePrivyToken', () => {
    it('should return true for a valid token', () => {
      const validJwt = 'valid.jwt.token';
      const decodedToken = {
        userId: 'testUserId',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken); // Mocking successful decoding

      expect(authService.validatePrivyToken(validJwt)).toBe(true);
    });

    it('should throw UnauthorizedException if userId is missing', () => {
      const invalidJwt = 'invalid.jwt.token';
      const decodedToken = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken); // Mocking userId missing

      expect(() => authService.validatePrivyToken(invalidJwt)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is expired', () => {
      const expiredJwt = 'expired.jwt.token';
      const decodedToken = {
        userId: 'testUserId',
        exp: Math.floor(Date.now() / 1000) - 1,
        iat: Math.floor(Date.now() / 1000),
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken); // Mocking expired token

      expect(() => authService.validatePrivyToken(expiredJwt)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for an invalid token', () => {
      const invalidJwt = 'invalid.jwt.token';

      (jwt_decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      }); // Mocking error

      expect(() => authService.validatePrivyToken(invalidJwt)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('extractUserIdFromToken', () => {
    it('should return userId from a valid token', () => {
      const validJwt = 'valid.jwt.token';
      const decodedToken = {
        userId: 'testUserId',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken); // Mocking successful decoding

      const userId = authService.extractUserIdFromToken(validJwt);
      expect(userId).toBe('testUserId');
    });

    it('should return null if userId is not present', () => {
      const invalidJwt = 'invalid.jwt.token';
      const decodedToken = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      (jwt_decode as jest.Mock).mockReturnValue(decodedToken); // Mocking userId missing

      const userId = authService.extractUserIdFromToken(invalidJwt);
      expect(userId).toBe(null);
    });

    it('should throw UnauthorizedException if token is invalid', () => {
      const invalidJwt = 'invalid.jwt.token';

      (jwt_decode as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to decode');
      }); // Mocking error

      expect(() => authService.extractUserIdFromToken(invalidJwt)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('generateMetaversalJwt', () => {
    it('should generate a valid JWT', () => {
      const userId = 'testUserId';
      const secretKey = 'superSecretKey';
      process.env.PRIVY_SECRET_KEY = secretKey; // Mock environment variable

      (jwt.sign as jest.Mock).mockReturnValue('generated.jwt.token'); // Mocking JWT generation

      const token = authService.generateMetaversalJwt(userId);
      expect(token).toBe('generated.jwt.token');
      expect(jwt.sign).toHaveBeenCalledWith({ userId }, secretKey, {
        expiresIn: '1h',
      });
    });

    it('should throw an error if secret key is not defined', () => {
      delete process.env.PRIVY_SECRET_KEY; // Remove the secret key

      expect(() => authService.generateMetaversalJwt('testUserId')).toThrow(
        'Secret key is not defined in environment variables',
      );
    });
  });
});
