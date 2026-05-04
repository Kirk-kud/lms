import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { createResponse } from '../common/response.helper';
import { Roles, RolesGuard } from '../auth/role.guard';
import { SetMeetingScheduleDto } from './meeting-schedule.dto';
import { MeetingScheduleService } from './meeting-schedule.service';

@Controller('meeting-schedule')
@UseGuards(RolesGuard)
export class MeetingScheduleController {
  constructor(private readonly service: MeetingScheduleService) {}

  @Get()
  async getSchedule() {
    const data = await this.service.getSchedule();
    return createResponse(data, 'Meeting schedule fetched');
  }

  @Put()
  @Roles('admin')
  async setSchedule(@Body() dto: SetMeetingScheduleDto) {
    const data = await this.service.setSchedule(dto);
    return createResponse(data, 'Meeting schedule updated');
  }
}
