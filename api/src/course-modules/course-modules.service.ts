import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateModuleDto,
  CreateModuleItemDto,
  ReorderItemsDto,
  UpdateModuleDto,
  UpdateModuleItemDto,
} from './course-modules.dto';

@Injectable()
export class CourseModulesService {
  private readonly storageUrl: string;

  constructor(
    private readonly supabase: SupabaseService,
    configService: ConfigService,
  ) {
    this.storageUrl = `${configService.getOrThrow('SUPABASE_URL')}/storage/v1/object/public/modules/`;
  }

  // ----------------------------------------------------------------
  // Access helpers
  // ----------------------------------------------------------------

  private async assertTutorOwnsClass(classId: string, tutorId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('classes')
      .select('id, tutor_id')
      .eq('id', classId)
      .single();

    if (error || !data) throw new NotFoundException('Class not found');
    if (data.tutor_id !== tutorId) throw new ForbiddenException();
    return data;
  }

  private async assertStudentEnrolled(classId: string, studentId: string) {
    const { data } = await this.supabase.adminClient
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!data) throw new ForbiddenException('Not enrolled in this class');
  }

  /** Resolves a module to its class_id and verifies tutor owns that class. */
  private async assertTutorOwnsModule(moduleId: string, tutorId: string) {
    const { data: mod, error } = await this.supabase.adminClient
      .from('modules')
      .select('id, class_id')
      .eq('id', moduleId)
      .single();

    if (error || !mod) throw new NotFoundException('Module not found');
    await this.assertTutorOwnsClass(mod.class_id, tutorId);
    return mod;
  }

  /** Resolves a module item up the ownership chain. */
  private async assertTutorOwnsItem(itemId: string, tutorId: string) {
    const { data: item, error } = await this.supabase.adminClient
      .from('module_items')
      .select('*, module:modules!module_id(id, class_id)')
      .eq('id', itemId)
      .single();

    if (error || !item) throw new NotFoundException('Item not found');
    const classId = (item.module as any).class_id as string;
    await this.assertTutorOwnsClass(classId, tutorId);
    return item;
  }

  // ----------------------------------------------------------------
  // GET /modules/class/:classId
  // ----------------------------------------------------------------
  async findByClass(classId: string, userId: string, role: string) {
    if (role === 'tutor') {
      await this.assertTutorOwnsClass(classId, userId);
    } else {
      await this.assertStudentEnrolled(classId, userId);
    }

    const { data, error } = await this.supabase.adminClient
      .from('modules')
      .select('*, items:module_items(*)')
      .eq('class_id', classId)
      .order('order_index', { ascending: true })
      .order('order_index', { ascending: true, referencedTable: 'module_items' });

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  // ----------------------------------------------------------------
  // POST /modules
  // ----------------------------------------------------------------
  async create(tutorId: string, dto: CreateModuleDto) {
    await this.assertTutorOwnsClass(dto.class_id, tutorId);

    const { data, error } = await this.supabase.adminClient
      .from('modules')
      .insert({ class_id: dto.class_id, title: dto.title, order_index: dto.order_index })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ----------------------------------------------------------------
  // PATCH /modules/:id
  // ----------------------------------------------------------------
  async update(moduleId: string, tutorId: string, dto: UpdateModuleDto) {
    await this.assertTutorOwnsModule(moduleId, tutorId);

    const { data, error } = await this.supabase.adminClient
      .from('modules')
      .update(dto)
      .eq('id', moduleId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ----------------------------------------------------------------
  // DELETE /modules/:id
  // ----------------------------------------------------------------
  async remove(moduleId: string, tutorId: string) {
    await this.assertTutorOwnsModule(moduleId, tutorId);

    const { error } = await this.supabase.adminClient
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) throw new BadRequestException(error.message);
  }

  // ----------------------------------------------------------------
  // POST /modules/:id/items
  // ----------------------------------------------------------------
  async createItem(
    moduleId: string,
    tutorId: string,
    dto: CreateModuleItemDto,
    file?: Express.Multer.File,
  ) {
    const mod = await this.assertTutorOwnsModule(moduleId, tutorId);
    let contentUrl = dto.content_url ?? null;

    if (dto.type === 'pdf' && file) {
      const path = `modules/${mod.class_id}/${Date.now()}_${file.originalname}`;
      const { error: uploadError } = await this.supabase.adminClient.storage
        .from('modules')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) throw new BadRequestException(uploadError.message);

      const { data: urlData } = this.supabase.adminClient.storage
        .from('modules')
        .getPublicUrl(path);

      contentUrl = urlData.publicUrl;
    }

    const { data, error } = await this.supabase.adminClient
      .from('module_items')
      .insert({
        module_id: moduleId,
        title: dto.title,
        type: dto.type,
        content_url: contentUrl,
        content_text: dto.content_text ?? null,
        order_index: dto.order_index,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ----------------------------------------------------------------
  // PATCH /modules/items/:itemId
  // ----------------------------------------------------------------
  async updateItem(
    itemId: string,
    tutorId: string,
    dto: UpdateModuleItemDto,
  ) {
    await this.assertTutorOwnsItem(itemId, tutorId);

    const { data, error } = await this.supabase.adminClient
      .from('module_items')
      .update(dto)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ----------------------------------------------------------------
  // DELETE /modules/items/:itemId
  // ----------------------------------------------------------------
  async removeItem(itemId: string, tutorId: string) {
    const item = await this.assertTutorOwnsItem(itemId, tutorId);

    // Delete storage file for PDFs
    if (item.type === 'pdf' && item.content_url) {
      const storagePath = (item.content_url as string).replace(this.storageUrl, '');
      if (storagePath) {
        await this.supabase.adminClient.storage
          .from('submissions')
          .remove([storagePath]);
      }
    }

    const { error } = await this.supabase.adminClient
      .from('module_items')
      .delete()
      .eq('id', itemId);

    if (error) throw new BadRequestException(error.message);
  }

  // ----------------------------------------------------------------
  // POST /modules/:id/reorder
  // ----------------------------------------------------------------
  async reorderItems(moduleId: string, tutorId: string, dto: ReorderItemsDto) {
    await this.assertTutorOwnsModule(moduleId, tutorId);

    await Promise.all(
      dto.items.map(({ item_id, order_index }) =>
        this.supabase.adminClient
          .from('module_items')
          .update({ order_index })
          .eq('id', item_id)
          .eq('module_id', moduleId),
      ),
    );

    const { data, error } = await this.supabase.adminClient
      .from('modules')
      .select('*, items:module_items(*)')
      .eq('id', moduleId)
      .order('order_index', { ascending: true, referencedTable: 'module_items' })
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
