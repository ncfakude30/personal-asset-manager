// src/auth/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  //Ideally we would want to get the token from the Headers <Authorization -> JWT Token>
  @Post()
  async authenticate(@Body('token') privyJwt: string) {
    const isValid = this.authService.validatePrivyToken(privyJwt);
    if (!isValid) throw new UnauthorizedException();

    // Extract user ID from the decoded Privy JWT
    const userId = this.authService.extractUserIdFromToken(privyJwt);
    if (!userId)
      throw new UnauthorizedException('User ID could not be extracted.');

    return { token: this.authService.generateMetaversalJwt(userId) };
  }
}
