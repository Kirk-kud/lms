import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles, RolesGuard } from '../auth/role.guard';
import { createResponse } from '../common/response.helper';
import { CreateTaInviteDto, RedeemTaInviteDto } from './ta-invites.dto';
import { TaInvitesService } from './ta-invites.service';

@Controller('ta-invites')
@UseGuards(RolesGuard)
export class TaInvitesController {
  constructor(private readonly service: TaInvitesService) {}

  @Post()
  @Roles('admin')
  async create(@Req() req: Request, @Body() dto: CreateTaInviteDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.create(user.sub, user.role, dto);
    return createResponse(data, 'TA invite created', 201);
  }

  @Public()
  @Post('redeem')
  async redeem(@Body() dto: RedeemTaInviteDto) {
    const data = await this.service.redeem(dto);
    return createResponse(data, 'TA invite redeemed');
  }
}
