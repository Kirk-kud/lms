import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CourseModulesService } from './course-modules.service';
import { CourseModulesController } from './course-modules.controller';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    }),
  ],
  controllers: [CourseModulesController],
  providers: [CourseModulesService],
})
export class CourseModulesModule {}
