// test/assets/assets.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AssetsController } from '../../../src/assets/assets.controller';
import { AssetsService } from '../../../src/assets/assets.service';
import { AuthGuard } from '../../../src/auth/auth.guard';
import {
  CreateAssetDto,
  RemoveAssetDto,
} from '../../../src/assets/dto/assets.dto';

describe('AssetsController (e2e)', () => {
  let app: INestApplication;
  let assetsService: AssetsService;

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true), // Mocked to always allow requests
  };

  const mockAssetsService = {
    addAsset: jest.fn(),
    removeAsset: jest.fn(),
    listAssets: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [{ provide: AssetsService, useValue: mockAssetsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard) // Overrides the AuthGuard with a mock
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    assetsService = moduleFixture.get<AssetsService>(AssetsService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/assets (POST)', () => {
    it('should add a new asset', async () => {
      const userId = 'user123';
      const assetData: CreateAssetDto = {
        name: 'Test Asset',
        type: 'ERC-20',
        smartContractAddress: '0x1234567890abcdef',
        chain: 'Ethereum',
        tokenId: undefined, // Optional
        quantity: 1000, // Only for ERC-20
      };
      const newAsset = { id: 'asset1', ...assetData, user_id: userId };

      mockAssetsService.addAsset.mockResolvedValue(newAsset);

      const response = await request(app.getHttpServer())
        .post('/assets')
        .send(assetData)
        .set('Authorization', `Bearer valid-token`)
        .expect(201);

      expect(assetsService.addAsset).toHaveBeenCalledWith(userId, assetData);
      expect(response.body).toEqual(newAsset);
    });
  });

  describe('/assets/:assetId (DELETE)', () => {
    it('should remove an asset by ID', async () => {
      const userId = 'user123';
      const assetId = 'asset1';

      mockAssetsService.removeAsset.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/assets/${assetId}`)
        .set('Authorization', `Bearer valid-token`)
        .expect(200);

      expect(assetsService.removeAsset).toHaveBeenCalledWith(userId, assetId);
    });

    it('should return 404 if asset is not found', async () => {
      const userId = 'user123';
      const assetId = 'nonexistentAsset';

      mockAssetsService.removeAsset.mockRejectedValue(
        new Error('Asset not found or not owned by user'),
      );

      const response = await request(app.getHttpServer())
        .delete(`/assets/${assetId}`)
        .set('Authorization', `Bearer valid-token`)
        .expect(404);

      expect(assetsService.removeAsset).toHaveBeenCalledWith(userId, assetId);
      expect(response.body.message).toBe(
        'Asset not found or not owned by user',
      );
    });
  });

  describe('/assets (GET)', () => {
    it('should list all assets for the user', async () => {
      const userId = 'user123';
      const assets = [
        {
          id: 'asset1',
          name: 'Asset 1',
          type: 'ERC-20',
          smartContractAddress: '0x1234567890abcdef',
          chain: 'Ethereum',
          tokenId: undefined,
          quantity: 500,
          user_id: userId,
        },
        {
          id: 'asset2',
          name: 'Asset 2',
          type: 'ERC-721',
          smartContractAddress: '0xabcdef1234567890',
          chain: 'Ethereum',
          tokenId: '1',
          quantity: undefined,
          user_id: userId,
        },
      ];

      mockAssetsService.listAssets.mockResolvedValue(assets);

      const response = await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer valid-token`)
        .expect(200);

      expect(assetsService.listAssets).toHaveBeenCalledWith(userId);
      expect(response.body).toEqual(assets);
    });
  });
});
