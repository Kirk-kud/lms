import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  CreateModuleDto,
  CreateModuleItemDto,
  ReorderItemsDto,
  UpdateModuleDto,
  UpdateModuleItemDto,
} from './course-modules.dto';
import { CourseModulesService } from './course-modules.service';

@Controller('modules')
@UseGuards(RolesGuard)
export class CourseModulesController {
  constructor(private readonly service: CourseModulesService) {}

  // GET /modules/class/:classId — literal segment declared before :id params
  @Get('class/:classId')
  async findByClass(@Req() req: Request, @Param('classId') classId: string) {
    const user = req.user as JwtPayload;
    const data = await this.service.findByClass(classId, user.sub, user.role);
    return createResponse(data, 'Modules fetched');
  }

  @Post()
  @Roles('tutor')
  async create(@Req() req: Request, @Body() dto: CreateModuleDto) {
    const user = req.user as JwtPayload;
    const data = await this.service.create(user.sub, dto);
    return createResponse(data, 'Module created', 201);
  }

  // PATCH /modules/items/:itemId — literal 'items' segment declared before :id
  @Patch('items/:itemId')
  @Roles('tutor')
  async updateItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateModuleItemDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.updateItem(itemId, user.sub, dto);
    return createResponse(data, 'Item updated');
  }

  // DELETE /modules/items/:itemId — same reason: before :id
  @Delete('items/:itemId')
  @Roles('tutor')
  async removeItem(@Req() req: Request, @Param('itemId') itemId: string) {
    const user = req.user as JwtPayload;
    await this.service.removeItem(itemId, user.sub);
    return createResponse(null, 'Item deleted');
  }

  @Patch(':id')
  @Roles('tutor')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateModuleDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.update(id, user.sub, dto);
    return createResponse(data, 'Module updated');
  }

  @Delete(':id')
  @Roles('tutor')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    await this.service.remove(id, user.sub);
    return createResponse(null, 'Module deleted');
  }

  @Post(':id/items')
  @Roles('tutor')
  @UseInterceptors(FileInterceptor('file'))
  async createItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateModuleItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.createItem(id, user.sub, dto, file);
    return createResponse(data, 'Item created', 201);
  }

  @Post(':id/reorder')
  @Roles('tutor')
  async reorderItems(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReorderItemsDto,
  ) {
    const user = req.user as JwtPayload;
    const data = await this.service.reorderItems(id, user.sub, dto);
    return createResponse(data, 'Items reordered');
  }
}
