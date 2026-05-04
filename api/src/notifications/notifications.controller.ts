import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { RolesGuard } from '../auth/role.guard';
import { createResponse } from '../common/response.helper';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const data = await this.service.findForUser(user.sub);
    return createResponse(data, 'Notifications fetched');
  }

  @Patch('read-all')
  async markAllRead(@Req() req: Request) {
    const user = req.user as JwtPayload;
    await this.service.markAllRead(user.sub);
    return createResponse(null, 'All notifications marked read');
  }

  @Patch(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    await this.service.markRead(user.sub, id);
    return createResponse(null, 'Notification marked read');
  }
}
