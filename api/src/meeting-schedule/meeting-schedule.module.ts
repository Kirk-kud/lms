import { Module } from '@nestjs/common';
import { MeetingScheduleService } from './meeting-schedule.service';
import { MeetingScheduleController } from './meeting-schedule.controller';

@Module({
  controllers: [MeetingScheduleController],
  providers: [MeetingScheduleService],
})
export class MeetingScheduleModule {}
