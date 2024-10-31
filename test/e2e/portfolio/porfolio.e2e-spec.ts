// test/e2e/portfolio/portfolio.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // Change to default import
import { PortfolioController } from '../../../src/portfolio/portfolio.controller';
import { PortfolioService } from '../../../src/portfolio/portfolio.service';
import { AuthGuard } from '../../../src/auth/auth.guard';

describe('PortfolioController (e2e)', () => {
  let app: INestApplication;
  let portfolioService: PortfolioService;

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true), // Mocked to always allow requests
  };

  const mockPortfolioService = {
    calculatePortfolioValue: jest.fn(),
    getAssetHistory: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    portfolioService = moduleFixture.get<PortfolioService>(PortfolioService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/portfolio (GET)', () => {
    it('should return the calculated portfolio value for the user', async () => {
      const userId = 'user123'; // You should extract user ID from the token in a real application
      const portfolioValue = { totalValue: 15000 };

      mockPortfolioService.calculatePortfolioValue.mockResolvedValue(
        portfolioValue,
      );

      const response = await request(app.getHttpServer())
        .get(`/portfolio`)
        .set('Authorization', `Bearer valid-token`)
        .expect(200);

      expect(portfolioService.calculatePortfolioValue).toHaveBeenCalledWith(
        userId,
      ); // Pass user ID
      expect(response.body).toEqual(portfolioValue);
    });

    it('should return 500 if there is an error calculating portfolio value', async () => {
      const userId = 'user123'; // You should extract user ID from the token in a real application

      mockPortfolioService.calculatePortfolioValue.mockRejectedValue(
        new Error('Calculation error'),
      );

      const response = await request(app.getHttpServer())
        .get(`/portfolio`)
        .set('Authorization', `Bearer valid-token`)
        .expect(500);

      expect(portfolioService.calculatePortfolioValue).toHaveBeenCalledWith(
        userId,
      ); // Pass user ID
      expect(response.body.message).toBe('Failed to calculate portfolio value');
    });
  });

  describe('/portfolio/asset/:assetId/history (GET)', () => {
    it('should return asset history for a given asset ID', async () => {
      const assetId = 'asset123';
      const assetHistory = [
        { asset_id: assetId, date: '2023-01-01', price: 100 },
        { asset_id: assetId, date: '2023-01-02', price: 105 },
      ];

      mockPortfolioService.getAssetHistory.mockResolvedValue(assetHistory);

      const response = await request(app.getHttpServer())
        .get(`/portfolio/asset/${assetId}/history`)
        .set('Authorization', `Bearer valid-token`)
        .expect(200);

      expect(portfolioService.getAssetHistory).toHaveBeenCalledWith(assetId);
      expect(response.body).toEqual(assetHistory);
    });

    it('should return 404 if the asset history is not found', async () => {
      const assetId = 'nonexistentAsset';

      mockPortfolioService.getAssetHistory.mockRejectedValue(
        new Error('Asset history not found'),
      );

      const response = await request(app.getHttpServer())
        .get(`/portfolio/asset/${assetId}/history`)
        .set('Authorization', `Bearer valid-token`)
        .expect(404);

      expect(portfolioService.getAssetHistory).toHaveBeenCalledWith(assetId);
      expect(response.body.message).toBe('Asset history not found');
    });
  });
});
