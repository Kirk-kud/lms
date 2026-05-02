import {
  Body,
  Controller,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles, RolesGuard } from '../auth/role.guard';
import { createResponse } from '../common/response.helper';
import {
  CreateEnrollmentDto,
  MoveEnrollmentCohortDto,
} from './enrollments.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
@UseGuards(RolesGuard)
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Post()
  @Roles('admin')
  async create(@Req() req: Request, @Body() dto: CreateEnrollmentDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.create(user.sub, dto);
    return createResponse(data, 'Enrollment created', 201);
  }

  @Patch(':id/cohort')
  @Roles('admin')
  async moveToCohort(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: MoveEnrollmentCohortDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.moveToCohort(id, user.sub, dto);
    return createResponse(data, 'Enrollment cohort updated');
  }
}
