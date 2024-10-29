import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service'; // Import AuthService

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const privyJwt = request.headers['authorization']?.split(' ')[1]; // Assuming token is sent as Bearer token

    if (!privyJwt) {
      throw new ForbiddenException('Access denied. No token provided.');
    }

    // Validate the Privy JWT
    const isValid = this.authService.validatePrivyToken(privyJwt);
    if (!isValid) {
      throw new ForbiddenException('Access denied. Invalid token.');
    }

    // Extract user ID from the token
    const userId = this.authService.extractUserIdFromToken(privyJwt);
    if (!userId) {
      throw new ForbiddenException('Access denied. No user found.');
    }

    // Attach the user to the request for later use
    request.user = { id: userId };
    return true; // User is authenticated
  }
}
