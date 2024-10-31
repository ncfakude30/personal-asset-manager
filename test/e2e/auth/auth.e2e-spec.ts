// test/auth/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockAuthService = {
    validatePrivyToken: jest.fn(),
    extractUserIdFromToken: jest.fn(),
    generateMetaversalJwt: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth (POST)', () => {
    it('should return a JWT token if the privyJwt token is valid', async () => {
      const privyJwt = 'validPrivyJwt';
      const userId = 'user123';
      const metaversalJwt = 'generatedMetaversalJwt';

      mockAuthService.validatePrivyToken.mockReturnValue(true);
      mockAuthService.extractUserIdFromToken.mockReturnValue(userId);
      mockAuthService.generateMetaversalJwt.mockReturnValue(metaversalJwt);

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ token: privyJwt })
        .expect(201);

      expect(authService.validatePrivyToken).toHaveBeenCalledWith(privyJwt);
      expect(authService.extractUserIdFromToken).toHaveBeenCalledWith(privyJwt);
      expect(authService.generateMetaversalJwt).toHaveBeenCalledWith(userId);
      expect(response.body).toEqual({ token: metaversalJwt });
    });

    it('should return 401 if the privyJwt token is invalid', async () => {
      const invalidPrivyJwt = 'invalidPrivyJwt';

      mockAuthService.validatePrivyToken.mockReturnValue(false);

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ token: invalidPrivyJwt })
        .expect(401);

      expect(authService.validatePrivyToken).toHaveBeenCalledWith(
        invalidPrivyJwt,
      );
      expect(authService.extractUserIdFromToken).not.toHaveBeenCalled();
      expect(authService.generateMetaversalJwt).not.toHaveBeenCalled();
      expect(response.body.message).toBe('Invalid privyJwt token.'); // Adjust this message according to your implementation
    });

    it('should return 401 if the user ID cannot be extracted', async () => {
      const privyJwt = 'validPrivyJwt';

      mockAuthService.validatePrivyToken.mockReturnValue(true);
      mockAuthService.extractUserIdFromToken.mockReturnValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ token: privyJwt })
        .expect(401);

      expect(authService.validatePrivyToken).toHaveBeenCalledWith(privyJwt);
      expect(authService.extractUserIdFromToken).toHaveBeenCalledWith(privyJwt);
      expect(authService.generateMetaversalJwt).not.toHaveBeenCalled();
      expect(response.body.message).toBe('User ID could not be extracted.'); // Ensure this matches your controller's response
    });

    it('should return 500 if an error occurs while generating the JWT', async () => {
      const privyJwt = 'validPrivyJwt';
      const userId = 'user123';

      mockAuthService.validatePrivyToken.mockReturnValue(true);
      mockAuthService.extractUserIdFromToken.mockReturnValue(userId);
      mockAuthService.generateMetaversalJwt.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ token: privyJwt })
        .expect(500);

      expect(authService.validatePrivyToken).toHaveBeenCalledWith(privyJwt);
      expect(authService.extractUserIdFromToken).toHaveBeenCalledWith(privyJwt);
      expect(authService.generateMetaversalJwt).toHaveBeenCalledWith(userId);
      expect(response.body.message).toBe('Internal server error.'); // Adjust this based on your error handling
    });
  });
});
