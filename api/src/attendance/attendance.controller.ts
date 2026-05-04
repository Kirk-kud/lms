import {
  Body,
  Controller,
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
import { CheckInDto, CreateSessionDto, ManualCheckInDto } from './attendance.dto';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('sessions')
  @Roles('admin')
  async createSession(@Req() req: Request, @Body() dto: CreateSessionDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.createSession(user.sub, user.role, dto);
    return createResponse(data, 'Session started', 201);
  }

  @Get('sessions')
  @Roles('admin', 'tutor')
  async getSessions(@Req() req: Request, @Query('class_id') classId: string) {
    const user = req.user as JwtPayload;
    const data = await this.service.getSessionsByClass(classId, user);
    return createResponse(data, 'Sessions fetched');
  }

  // Literal 'class' segment declared before ':sessionId' param route
  @Get('sessions/class/:classId')
  @Roles('admin', 'tutor')
  async getSessionsByClass(
    @Req() req: Request,
    @Param('classId') classId: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.getSessionsByClass(classId, user);
    return createResponse(data, 'Sessions fetched');
  }

  @Post('sessions/:sessionId/records/manual')
  @Roles('admin', 'tutor')
  async manualCheckIn(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
    @Body() dto: ManualCheckInDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.manualCheckIn(sessionId, user.sub, user.role, dto.student_id);
    return createResponse(data, 'Student marked present', 201);
  }

  @Get('sessions/:sessionId/records')
  @Roles('admin', 'tutor')
  async getSessionRecords(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
    @Query('cohort_id') cohortId?: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.getSessionRecords(
      sessionId,
      user,
      cohortId,
    );
    return createResponse(data, 'Records fetched');
  }

  @Post('checkin')
  @Roles('student')
  async checkIn(@Req() req: Request, @Body() dto: CheckInDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.checkIn(user.sub, dto);
    return createResponse(data, 'Checked in successfully');
  }

  @Get('my/:classId')
  @Roles('student')
  async getMyAttendance(
    @Req() req: Request,
    @Param('classId') classId: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.getMyAttendance(user.sub, classId);
    return createResponse(data, 'Attendance fetched');
  }

  @Patch('sessions/:sessionId')
  @Roles('admin', 'tutor')
  async endSession(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.endSession(sessionId, user);
    return createResponse(data, 'Session ended');
  }
}
