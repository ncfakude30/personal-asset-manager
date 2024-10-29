// src/auth/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  async authenticate(@Body('privyJwt') privyJwt: string) {
    const isValid = this.authService.validatePrivyToken(privyJwt);
    if (!isValid) throw new UnauthorizedException();
    const userId = 'cm2uh4g5800ol5e2i8bfrb9z6';
    return { token: this.authService.generateMetaversalJwt(userId) };
  }
}
