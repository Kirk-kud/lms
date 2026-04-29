import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { CourseModulesModule } from './course-modules/course-modules.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { JwtAuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/role.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    ClassesModule,
    CourseModulesModule,
    AssignmentsModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
