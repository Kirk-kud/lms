import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, AuthService],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
