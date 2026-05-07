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
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentBodyDto,
  UpdateAssignmentDto,
} from './assignments.dto';
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

  // Literal segments declared before param routes to avoid conflicts
  @Get('mine')
  async findMine(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const data = await this.service.findAllForUser(
      user.sub,
      user.role ?? 'student',
    );
    return createResponse(data, 'Assignments fetched');
  }

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
  @Roles('admin', 'tutor')
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
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: SubmitAssignmentBodyDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.submit(id, user.sub, file, body);
    return createResponse(data, 'Assignment submitted', 201);
  }

  @Post(':id/instruction-file')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadInstructionFile(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.uploadInstructionPdf(
      id,
      user.sub,
      user.role ?? null,
      file,
    );
    return createResponse(data, 'Instruction file uploaded');
  }

  @Get(':id/submissions/:submissionId/view-url')
  @Roles('admin', 'tutor')
  async getSubmissionViewUrl(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.getSubmissionViewUrl(
      id,
      submissionId,
      user.sub,
      user.role,
    );
    return createResponse(data, 'View URL generated');
  }

  @Patch(':id/submissions/:submissionId')
  @Roles('admin', 'tutor')
  async gradeSubmission(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.gradeSubmission(
      id,
      submissionId,
      user.sub,
      user.role,
      dto,
    );
    return createResponse(data, 'Submission graded');
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
