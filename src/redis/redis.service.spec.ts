import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { Logger } from '@nestjs/common';
import { redisConfig } from '../config/redis.config';
import { ConfigType } from '@nestjs/config';
import { RedisClientType } from 'redis';

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    quit: jest.fn(),
  })),
}));

describe('RedisService', () => {
  let service: RedisService;
  let client: RedisClientType;
  let logger: Logger;

  const mockRedisConfig: ConfigType<typeof redisConfig> = {
    redisUrl: 'redis://localhost:6379',
  };

  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: redisConfig.KEY, useValue: mockRedisConfig },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    client = service['client'] as any;
    logger = module.get<Logger>(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('on module init', () => {
    it('should create a Redis connection and register event handlers', () => {
      expect(client.connect).toHaveBeenCalled();
      expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith(
        'reconnecting',
        expect.any(Function),
      );
      expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });
  });

  describe('get', () => {
    it('should return the value for a given key', async () => {
      const mockValue = { data: 'test' };
      client.get = jest.fn().mockResolvedValueOnce(JSON.stringify(mockValue));

      const result = await service.get('test-key');

      expect(result).toEqual(mockValue);
      expect(client.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null if key does not exist', async () => {
      client.get = jest.fn().mockResolvedValueOnce(null);

      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
      expect(client.get).toHaveBeenCalledWith('nonexistent-key');
    });

    it('should log and throw an error if getting key fails', async () => {
      const mockError = new Error('Get failed');
      client.get = jest.fn().mockRejectedValueOnce(mockError);

      await expect(service.get('test-key')).rejects.toThrow(mockError);
      expect(client.get).toHaveBeenCalledWith('test-key');
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to get key test-key: ${mockError.message}`,
      );
    });
  });

  describe('set', () => {
    it('should set a value for a given key without expiry', async () => {
      const mockValue = { data: 'test' };

      await service.set('test-key', mockValue);

      expect(client.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(mockValue),
      );
    });

    it('should set a value for a given key with expiry', async () => {
      const mockValue = { data: 'test' };

      await service.set('test-key', mockValue, 3600);

      expect(client.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(mockValue),
      );
    });

    it('should log and throw an error if setting key fails', async () => {
      const mockError = new Error('Set failed');
      client.set = jest.fn().mockRejectedValueOnce(mockError);

      await expect(service.set('test-key', 'value')).rejects.toThrow(mockError);
      expect(client.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('value'),
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to set key test-key: ${mockError.message}`,
      );
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      await service.del('test-key');

      expect(client.del).toHaveBeenCalledWith('test-key');
    });

    it('should log and throw an error if deleting key fails', async () => {
      const mockError = new Error('Delete failed');
      client.del = jest.fn().mockRejectedValueOnce(mockError);

      await expect(service.del('test-key')).rejects.toThrow(mockError);
      expect(client.del).toHaveBeenCalledWith('test-key');
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to delete key test-key: ${mockError.message}`,
      );
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      client.exists = jest.fn().mockResolvedValueOnce(1);

      const result = await service.exists('test-key');

      expect(result).toBe(true);
      expect(client.exists).toHaveBeenCalledWith('test-key');
    });

    it('should return false if key does not exist', async () => {
      client.exists = jest.fn().mockResolvedValueOnce(0);

      const result = await service.exists('nonexistent-key');

      expect(result).toBe(false);
      expect(client.exists).toHaveBeenCalledWith('nonexistent-key');
    });

    it('should log and throw an error if checking key existence fails', async () => {
      const mockError = new Error('Exists failed');
      client.exists = jest.fn().mockRejectedValueOnce(mockError);

      await expect(service.exists('test-key')).rejects.toThrow(mockError);
      expect(client.exists).toHaveBeenCalledWith('test-key');
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to check existence of key test-key: ${mockError.message}`,
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect the Redis client', async () => {
      await service.disconnect();

      expect(client.quit).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        'Redis client disconnected successfully',
      );
    });

    it('should log and throw an error if disconnecting fails', async () => {
      const mockError = new Error('Disconnect failed');
      client.quit = jest.fn().mockRejectedValueOnce(mockError);

      await expect(service.disconnect()).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to disconnect Redis client: ${mockError.message}`,
      );
    });
  });
});
