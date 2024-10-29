import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { Kysely } from 'kysely';
import { Asset } from '../../src/database/types';

describe('AssetsService', () => {
  let service: AssetsService;
  let db: Partial<Kysely<any>>;

  beforeEach(async () => {
    db = {
      insertInto: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returningAll: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      deleteFrom: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      selectFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsService, { provide: 'KYSLEY_DB', useValue: db }],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  describe('addAsset', () => {
    it('should add a new asset and return it', async () => {
      const userId = 'testUserId';
      const assetData = {
        name: 'Test Asset',
        description: 'Asset description',
      };
      const newAsset = { id: '1', user_id: userId, ...assetData };

      (db.execute as jest.Mock).mockResolvedValueOnce([newAsset]); // Mocking the insert operation

      const result = await service.addAsset(userId, assetData);
      expect(result).toEqual(newAsset);
      expect(db.insertInto).toHaveBeenCalledWith('assets');
      expect(db.values).toHaveBeenCalledWith({ ...assetData, user_id: userId });
    });

    it('should throw an error if adding an asset fails', async () => {
      const userId = 'testUserId';
      const assetData = {
        name: 'Test Asset',
        description: 'Asset description',
      };

      (db.execute as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(service.addAsset(userId, assetData)).rejects.toThrow(
        'Could not add asset',
      );
    });
  });

  describe('removeAsset', () => {
    it('should remove an asset', async () => {
      const userId = 'testUserId';
      const assetId = '1';

      await service.removeAsset(userId, assetId);

      expect(db.deleteFrom).toHaveBeenCalledWith('assets');
      expect(db.where).toHaveBeenCalledWith('id', '=', assetId);
      expect(db.where).toHaveBeenCalledWith('user_id', '=', userId);
      expect(db.execute).toHaveBeenCalled();
    });
  });

  describe('listAssets', () => {
    it('should return a list of assets for a user', async () => {
      const userId = 'testUserId';
      const assets = [
        { id: '1', name: 'Asset 1', user_id: userId },
        { id: '2', name: 'Asset 2', user_id: userId },
      ];

      (db.execute as jest.Mock).mockResolvedValueOnce(assets);

      const result = await service.listAssets(userId);
      expect(result).toEqual(assets);
      expect(db.selectFrom).toHaveBeenCalledWith('assets');
      expect(db.where).toHaveBeenCalledWith('user_id', '=', userId);
    });
  });
});
