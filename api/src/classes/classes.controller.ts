import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { createResponse } from '../common/response.helper';
import { Roles, RolesGuard } from '../auth/role.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  AddClassStudentDto,
  CreateClassDto,
  JoinClassDto,
  UpdateClassDto,
} from './classes.dto';
import { ClassesService } from './classes.service';

@Controller('classes')
@UseGuards(RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles('admin')
  async create(@Req() req: Request, @Body() dto: CreateClassDto) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.create(user.sub, dto);
    return createResponse(data, 'Class created', 201);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.findAll(user.sub, user.role);
    return createResponse(data, 'Classes fetched');
  }

  // POST /classes/join must be declared before GET /classes/:id
  // to prevent "join" from being captured by the :id param
  @Post('join')
  @Roles('student')
  async join(@Req() req: Request, @Body() dto: JoinClassDto) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.join(user.sub, dto);
    return createResponse(data, 'Joined class successfully');
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.findOne(id, user.sub, user.role);
    return createResponse(data, 'Class fetched');
  }

  @Get(':id/roster')
  @Roles('admin')
  async getRoster(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.getRoster(id, user.sub, user.role);
    return createResponse(data, 'Roster fetched');
  }

  @Get(':id/students/searchable')
  @Roles('admin', 'tutor')
  async searchStudents(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('q') q: string,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.searchNonEnrolledStudents(
      id,
      user.sub,
      user.role,
      q ?? '',
    );
    return createResponse(data, 'Students fetched');
  }

  @Post(':id/students')
  @Roles('admin')
  async addStudent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddClassStudentDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.addStudent(
      id,
      user.sub,
      user.role,
      dto,
    );
    return createResponse(data, 'Student added to class', 201);
  }

  @Delete(':id/students/:studentId')
  @Roles('admin')
  async removeStudent(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    const user = req.user as JwtPayload;
    await this.classesService.removeStudent(id, user.sub, user.role, studentId);
    return createResponse(null, 'Student removed from class');
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.classesService.update(id, user.sub, user.role, dto);
    return createResponse(data, 'Class updated');
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(200)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    await this.classesService.remove(id, user.sub, user.role);
    return createResponse(null, 'Class deleted');
  }
}
