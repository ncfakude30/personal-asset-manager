import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { MetricsService } from '../metrics/metrics.service';
import { InternalServerErrorException } from '@nestjs/common';
import { AssetDailyPrice } from '../database/types';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let db: any;
  let metrics: MetricsService;

  const mockMetricsService = {
    increment: jest.fn(),
  };

  const mockDb = {
    selectFrom: jest.fn(() => mockDb),
    selectAll: jest.fn(() => mockDb),
    where: jest.fn(() => mockDb),
    orderBy: jest.fn(() => mockDb),
    limit: jest.fn(() => mockDb),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: 'KYSLEY_DB', useValue: mockDb },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    db = module.get('KYSLEY_DB');
    metrics = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePortfolioValue', () => {
    it('should calculate and return the total portfolio value for a user', async () => {
      const userId = 'user1';
      const assets = [
        { id: 'asset1', quantity: 10 },
        { id: 'asset2', quantity: 5 },
      ];
      const assetPrices = [
        { price: 100 }, // Latest price for asset1
        { price: 200 }, // Latest price for asset2
      ];

      db.execute.mockResolvedValueOnce(assets);
      db.executeTakeFirst
        .mockResolvedValueOnce(assetPrices[0]) // for asset1
        .mockResolvedValueOnce(assetPrices[1]); // for asset2

      const result = await service.calculatePortfolioValue(userId);

      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.calculate_portfolio_value.count',
      );
      expect(db.selectFrom).toHaveBeenCalledWith('assets');
      expect(db.where).toHaveBeenCalledWith('user_id', '=', userId);
      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.calculate_portfolio_value.success',
      );
      expect(result.totalValue).toBe(100 * 10 + 200 * 5);
    });

    it('should increment failure metric and throw error if calculation fails', async () => {
      const userId = 'user1';
      const error = new Error('DB Error');

      db.execute.mockRejectedValueOnce(error);

      await expect(service.calculatePortfolioValue(userId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.calculate_portfolio_value.count',
      );
      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.calculate_portfolio_value.failure',
      );
    });
  });

  describe('getAssetHistory', () => {
    it('should return the history of asset prices', async () => {
      const assetId = 'asset1';
      const historyData: AssetDailyPrice[] = [
        { asset_id: assetId, date: new Date('2023-01-01'), price: 100 },
        { asset_id: assetId, date: new Date('2023-01-02'), price: 110 },
      ];

      db.execute.mockResolvedValueOnce(historyData);

      const result = await service.getAssetHistory(assetId);

      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.get_asset_history.count',
      );
      expect(db.selectFrom).toHaveBeenCalledWith('asset_daily_price');
      expect(db.where).toHaveBeenCalledWith('asset_id', '=', assetId);
      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.get_asset_history.success',
      );
      expect(result).toEqual(historyData);
    });

    it('should increment failure metric and throw error if fetching history fails', async () => {
      const assetId = 'asset1';
      const error = new Error('DB Error');

      db.execute.mockRejectedValueOnce(error);

      await expect(service.getAssetHistory(assetId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.get_asset_history.count',
      );
      expect(metrics.increment).toHaveBeenCalledWith(
        'portfolio.get_asset_history.failure',
      );
    });
  });
});
