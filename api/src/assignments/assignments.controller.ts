import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { createResponse } from '../common/response.helper';
import { Roles, RolesGuard } from '../auth/role.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateAssignmentDto, UpdateAssignmentDto } from './assignments.dto';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
@UseGuards(RolesGuard)
export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  @Get()
  async findByQuery(
    @Req() req: Request,
    @Query('class_id') classId: string,
    @Query('cohort_id') cohortId?: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.findByClass(
      classId,
      user.sub,
      user.role,
      cohortId,
    );
    return createResponse(data, 'Assignments fetched');
  }

  @Get('batch')
  @Roles('admin')
  async findBatch(@Query('class_ids') classIds: string) {
    const data = await this.service.findBatchForAdmin(
      classIds?.split(',') ?? [],
    );
    return createResponse(data, 'Assignments fetched');
  }

  // Literal segment 'class' declared before param routes
  @Get('class/:classId')
  async findByClass(@Req() req: Request, @Param('classId') classId: string) {
    const user = req.user as JwtPayload;
    const data = await this.service.findByClass(classId, user.sub, user.role);
    return createResponse(data, 'Assignments fetched');
  }

  @Post()
  @Roles('admin')
  async create(@Req() req: Request, @Body() dto: CreateAssignmentDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.create(user.sub, user.role, dto);
    return createResponse(data, 'Assignment created', 201);
  }

  @Get(':id/submissions')
  @Roles('admin')
  async getSubmissions(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    const data = await this.service.getSubmissions(id, user.sub, user.role);
    return createResponse(data, 'Submissions fetched');
  }

  @Post(':id/submit')
  @Roles('student')
  @UseInterceptors(FileInterceptor('file'))
  async submit(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.submit(id, user.sub, file);
    return createResponse(data, 'Assignment submitted', 201);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.update(id, user.sub, user.role, dto);
    return createResponse(data, 'Assignment updated');
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    await this.service.remove(id, user.sub, user.role);
    return createResponse(null, 'Assignment deleted');
  }
}
