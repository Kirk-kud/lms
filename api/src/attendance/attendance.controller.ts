import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { createResponse } from '../common/response.helper';
import { Roles, RolesGuard } from '../auth/role.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CheckInDto, CreateSessionDto } from './attendance.dto';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('sessions')
  @Roles('tutor')
  async createSession(@Req() req: Request, @Body() dto: CreateSessionDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.createSession(user.sub, dto);
    return createResponse(data, 'Session started', 201);
  }

  // Literal 'class' segment declared before ':sessionId' param route
  @Get('sessions/class/:classId')
  @Roles('tutor')
  async getSessionsByClass(
    @Req() req: Request,
    @Param('classId') classId: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.getSessionsByClass(classId, user.sub);
    return createResponse(data, 'Sessions fetched');
  }

  @Get('sessions/:sessionId/records')
  @Roles('tutor')
  async getSessionRecords(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.getSessionRecords(sessionId, user.sub);
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
}
