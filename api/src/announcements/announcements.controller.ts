import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './announcements.dto';
import { Roles, RolesGuard } from '../auth/role.guard';
import { createResponse } from '../common/response.helper';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('announcements')
@UseGuards(RolesGuard)
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const data = await this.service.findForUser(user.sub, user.role ?? 'student');
    return createResponse(data, 'Announcements fetched');
  }

  @Post()
  @Roles('admin')
  async create(@Req() req: Request, @Body() dto: CreateAnnouncementDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.create(user.sub, dto);
    return createResponse(data, 'Announcement created', 201);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    await this.service.remove(id, user.sub, user.role);
    return createResponse(null, 'Announcement deleted');
  }
}
