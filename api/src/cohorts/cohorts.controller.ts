import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { createResponse } from '../common/response.helper';
import { Roles, RolesGuard } from '../auth/role.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  AddCohortStudentDto,
  CreateCohortDto,
  UpdateCohortDto,
} from './cohorts.dto';
import { CohortsService } from './cohorts.service';

@Controller('cohorts')
@UseGuards(RolesGuard)
export class CohortsController {
  constructor(private readonly service: CohortsService) {}

  @Get()
  @Roles('admin', 'tutor')
  async findAll(@Req() req: Request, @Query('class_id') classId: string) {
    const user = req.user as JwtPayload;
    const data = await this.service.findAll(classId, user);
    return createResponse(data, 'Cohorts fetched');
  }

  @Post()
  @Roles('admin')
  async create(@Req() req: Request, @Body() dto: CreateCohortDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.create(user.sub, dto);
    return createResponse(data, 'Cohort created', 201);
  }

  @Get(':id')
  @Roles('admin', 'tutor', 'student')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    const data = await this.service.findOne(id, user);
    return createResponse(data, 'Cohort fetched');
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCohortDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.update(id, user.sub, dto);
    return createResponse(data, 'Cohort updated');
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    await this.service.remove(id, user.sub);
    return createResponse(null, 'Cohort deleted');
  }

  @Get(':id/students')
  @Roles('admin', 'tutor')
  async getStudents(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    const data = await this.service.getStudents(id, user);
    return createResponse(data, 'Cohort students fetched');
  }

  @Post(':id/students')
  @Roles('admin', 'tutor')
  async addStudent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddCohortStudentDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.addStudent(id, user, dto);
    return createResponse(data, 'Student added to cohort', 201);
  }

  @Delete(':id/students/:studentId')
  @Roles('admin', 'tutor')
  async removeStudent(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    const user = req.user as JwtPayload;
    await this.service.removeStudent(id, user, studentId);
    return createResponse(null, 'Student removed from cohort');
  }
}
