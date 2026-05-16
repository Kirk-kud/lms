import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createResponse } from '../common/response.helper';
import { Public } from './auth.guard';
import { LoginDto, RegisterDto, RefreshTokenDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return createResponse(data, 'User registered successfully', 201);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return createResponse(data, 'Login successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refresh(dto);
    return createResponse(data, 'Token refreshed');
  }

  @Public()
  @Get('me')
  async me(@Req() req: Request) {
    const auth = req.headers.authorization ?? '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1];

    // Supports platform healthcheck at /api/auth/me (no token → 200)
    if (!token) {
      return createResponse({ status: 'ok' }, 'OK');
    }

    const data = await this.authService.getMeFromAccessToken(token);
    return createResponse(data, 'Profile fetched');
  }
}
