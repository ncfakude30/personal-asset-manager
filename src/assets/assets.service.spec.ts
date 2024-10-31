import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { MetricsService } from '../metrics/metrics.service';
import { Asset } from '../database/types';
import { CreateAssetDto } from './dto/assets.dto';

describe('AssetsService', () => {
  let service: AssetsService;
  let db: any;
  let metrics: MetricsService;

  const mockMetricsService = {
    increment: jest.fn(),
    decrement: jest.fn(),
  };

  const mockDb = {
    insertInto: jest.fn(() => mockDb),
    values: jest.fn(() => mockDb),
    returningAll: jest.fn(() => mockDb),
    execute: jest.fn(),

    selectFrom: jest.fn(() => mockDb),
    select: jest.fn(() => mockDb),
    where: jest.fn(() => mockDb),
    selectAll: jest.fn(() => mockDb),

    deleteFrom: jest.fn(() => mockDb),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: 'KYSLEY_DB', useValue: mockDb },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    db = module.get('KYSLEY_DB');
    metrics = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addAsset', () => {
    it('should add an asset and return the new asset', async () => {
      const userId = 'user1';
      const assetData: CreateAssetDto = { name: 'Test Asset' } as any;
      const newAsset = { id: 'asset1', ...assetData, user_id: userId };

      db.execute.mockResolvedValueOnce([newAsset]);

      const result = await service.addAsset(userId, assetData);

      expect(metrics.increment).toHaveBeenCalledWith('assets.add_asset.count');
      expect(db.insertInto).toHaveBeenCalledWith('assets');
      expect(db.values).toHaveBeenCalledWith({ ...assetData, user_id: userId });
      expect(metrics.increment).toHaveBeenCalledWith(
        'assets.add_asset.success',
      );
      expect(result).toEqual(newAsset);
    });

    it('should increment failure metric and throw an error if adding asset fails', async () => {
      const userId = 'user1';
      const assetData: CreateAssetDto = { name: 'Test Asset' } as any;
      const error = new Error('Failed to add asset');

      db.execute.mockRejectedValueOnce(error);

      await expect(service.addAsset(userId, assetData)).rejects.toThrow(
        'Could not add asset',
      );
      expect(metrics.increment).toHaveBeenCalledWith('assets.add_asset.count');
      expect(metrics.increment).toHaveBeenCalledWith(
        'assets.add_asset.failure',
      );
    });
  });

  describe('removeAsset', () => {
    it('should remove an asset if it exists and is owned by the user', async () => {
      const userId = 'user1';
      const assetId = 'asset1';
      db.execute.mockResolvedValueOnce([{ id: assetId }]);

      await service.removeAsset(userId, assetId);

      expect(db.selectFrom).toHaveBeenCalledWith('assets');
      expect(db.deleteFrom).toHaveBeenCalledWith('assets');
      expect(metrics.decrement).toHaveBeenCalledWith('assets_removed');
    });

    it('should throw an error if the asset does not exist or is not owned by the user', async () => {
      const userId = 'user1';
      const assetId = 'asset1';

      db.execute.mockResolvedValueOnce([]);

      await expect(service.removeAsset(userId, assetId)).rejects.toThrow(
        'Asset not found or not owned by user',
      );
    });
  });

  describe('listAssets', () => {
    it('should list all assets for a given user', async () => {
      const userId = 'user1';
      const assets = [
        { id: 'asset1', name: 'Asset 1', user_id: userId },
        { id: 'asset2', name: 'Asset 2', user_id: userId },
      ];

      db.execute.mockResolvedValueOnce(assets);

      const result = await service.listAssets(userId);

      expect(db.selectFrom).toHaveBeenCalledWith('assets');
      expect(db.where).toHaveBeenCalledWith('user_id', '=', userId);
      expect(result).toEqual(assets);
    });
  });
});
