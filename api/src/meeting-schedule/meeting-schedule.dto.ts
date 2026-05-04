import { IsArray, IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class SetMeetingScheduleDto {
  @IsArray()
  @IsString({ each: true })
  days_of_week: string[];

  @IsString()
  @IsNotEmpty()
  time_of_day: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
