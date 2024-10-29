import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { Kysely } from 'kysely';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let db: Partial<Kysely<any>>;

  beforeEach(async () => {
    db = {
      selectFrom: jest.fn(() => ({
        selectAll: jest.fn(() => ({
          where: jest.fn(() => ({
            execute: jest.fn(),
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                executeTakeFirst: jest.fn(),
              })),
            })),
          })),
        })),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfolioService, { provide: 'KYSLEY_DB', useValue: db }],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  describe('calculatePortfolioValue', () => {
    it('should return total portfolio value', async () => {
      const userId = 'testUserId';
      const assets = [
        { id: 'asset1', quantity: 2 },
        { id: 'asset2', quantity: 3 },
      ];
      const latestPrices = [
        { price: 100, asset_id: 'asset1' },
        { price: 200, asset_id: 'asset2' },
      ];

      (db.selectFrom as jest.Mock).mockReturnValueOnce({
        selectAll: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            execute: jest.fn().mockResolvedValueOnce(assets), // Mocking asset query
          }),
        }),
      });

      (db.selectFrom as jest.Mock).mockReturnValueOnce({
        selectAll: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            orderBy: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockReturnValueOnce({
                executeTakeFirst: jest
                  .fn()
                  .mockResolvedValueOnce(latestPrices[0]) // Mocking price for asset1
                  .mockResolvedValueOnce(latestPrices[1]), // Mocking price for asset2
              }),
            }),
          }),
        }),
      });

      const result = await service.calculatePortfolioValue(userId);
      expect(result).toEqual({ totalValue: 800 }); // (2 * 100) + (3 * 200)
    });

    it('should return zero if no assets are found', async () => {
      const userId = 'testUserId';

      (db.selectFrom as jest.Mock).mockReturnValueOnce({
        selectAll: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            execute: jest.fn().mockResolvedValueOnce([]), // No assets
          }),
        }),
      });

      const result = await service.calculatePortfolioValue(userId);
      expect(result).toEqual({ totalValue: 0 });
    });
  });

  describe('getAssetHistory', () => {
    it('should return asset price history', async () => {
      const assetId = 'asset1';
      const historyRecords = [
        { asset_id: assetId, date: '2023-01-01', price: 100 },
        { asset_id: assetId, date: '2023-01-02', price: 120 },
      ];

      (db.selectFrom as jest.Mock).mockReturnValueOnce({
        selectAll: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            execute: jest.fn().mockResolvedValueOnce(historyRecords), // Mocking history query
          }),
        }),
      });

      const result = await service.getAssetHistory(assetId);
      expect(result).toEqual(historyRecords);
      expect(db.selectFrom).toHaveBeenCalledWith('asset_daily_price');
      expect(db.selectFrom().selectAll().where).toHaveBeenCalledWith(
        'asset_id',
        '=',
        assetId,
      );
    });

    it('should return an empty array if no history is found', async () => {
      const assetId = 'asset1';

      (db.selectFrom as jest.Mock).mockReturnValueOnce({
        selectAll: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            execute: jest.fn().mockResolvedValueOnce([]), // No history
          }),
        }),
      });

      const result = await service.getAssetHistory(assetId);
      expect(result).toEqual([]);
    });
  });
});
