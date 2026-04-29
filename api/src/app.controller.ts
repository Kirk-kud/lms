import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
