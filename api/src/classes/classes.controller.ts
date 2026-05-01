import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { createResponse } from '../common/response.helper';
import { Roles, RolesGuard } from '../auth/role.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateClassDto, JoinClassDto } from './classes.dto';
import { ClassesService } from './classes.service';

@Controller('classes')
@UseGuards(RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles('tutor')
  async create(@Req() req: Request, @Body() dto: CreateClassDto) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.create(user.sub, dto);
    return createResponse(data, 'Class created', 201);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.findAll(user.sub, user.role);
    return createResponse(data, 'Classes fetched');
  }

  // POST /classes/join must be declared before GET /classes/:id
  // to prevent "join" from being captured by the :id param
  @Post('join')
  @Roles('student')
  async join(@Req() req: Request, @Body() dto: JoinClassDto) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.join(user.sub, dto);
    return createResponse(data, 'Joined class successfully');
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.findOne(id, user.sub, user.role);
    return createResponse(data, 'Class fetched');
  }

  @Get(':id/roster')
  @Roles('tutor')
  async getRoster(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.getRoster(id, user.sub);
    return createResponse(data, 'Roster fetched');
  }

  @Delete(':id')
  @Roles('tutor')
  @HttpCode(200)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    await this.classesService.remove(id, user.sub);
    return createResponse(null, 'Class deleted');
  }
}
