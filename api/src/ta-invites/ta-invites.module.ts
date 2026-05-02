import { Module } from '@nestjs/common';
import { TaInvitesController } from './ta-invites.controller';
import { TaInvitesService } from './ta-invites.service';

@Module({
  controllers: [TaInvitesController],
  providers: [TaInvitesService],
})
export class TaInvitesModule {}
