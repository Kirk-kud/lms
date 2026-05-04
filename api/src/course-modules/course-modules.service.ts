import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import {
  assertCohortBelongsToClass,
  getTutorCohortForClass,
} from '../common/access.helper';
import {
  CreateModuleDto,
  CreateModuleItemDto,
  ReorderItemsDto,
  UpdateModuleDto,
  UpdateModuleItemDto,
} from './course-modules.dto';

const MAX_MODULE_PDF_SIZE = 25 * 1024 * 1024; // 25 MB

@Injectable()
export class CourseModulesService {
  private readonly storageUrl: string;
  private readonly logger = new Logger(CourseModulesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    configService: ConfigService,
  ) {
    this.storageUrl = `${configService.getOrThrow('SUPABASE_URL')}/storage/v1/object/public/modules/`;
  }

  // ----------------------------------------------------------------
  // Access helpers
  // ----------------------------------------------------------------

  private async assertTutorOwnsClass(
    classId: string,
    tutorId: string,
    role?: string | null,
  ) {
    const { data, error } = await this.supabase.adminClient
      .from('classes')
      .select('id, tutor_id')
      .eq('id', classId)
      .single();

    if (error || !data) throw new NotFoundException('Class not found');
    if (role !== 'admin' && data.tutor_id !== tutorId)
      throw new ForbiddenException();
    return data;
  }

  private async assertStudentEnrolled(classId: string, studentId: string) {
    const { data } = await this.supabase.adminClient
      .from('enrollments')
      .select('id, cohort_id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!data) throw new ForbiddenException('Not enrolled in this class');
    return data;
  }

  /** Resolves a module to its class_id and verifies tutor owns that class. */
  private async assertTutorOwnsModule(
    moduleId: string,
    tutorId: string,
    role?: string | null,
  ) {
    const { data: mod, error } = await this.supabase.adminClient
      .from('modules')
      .select('id, class_id')
      .eq('id', moduleId)
      .single();

    if (error || !mod) throw new NotFoundException('Module not found');
    await this.assertTutorOwnsClass(mod.class_id, tutorId, role);
    return mod;
  }

  /** Resolves a module item up the ownership chain. */
  private async assertTutorOwnsItem(
    itemId: string,
    tutorId: string,
    role?: string | null,
  ) {
    const { data: item, error } = await this.supabase.adminClient
      .from('module_items')
      .select('*, module:modules!module_id(id, class_id)')
      .eq('id', itemId)
      .single();

    if (error || !item) throw new NotFoundException('Item not found');
    const classId = item.module.class_id as string;
    await this.assertTutorOwnsClass(classId, tutorId, role);
    return item;
  }

  // ----------------------------------------------------------------
  // GET /modules/class/:classId
  // ----------------------------------------------------------------
  async findByClass(
    classId: string,
    userId: string,
    role: string | null,
    cohortId?: string,
  ) {
    if (!classId) throw new BadRequestException('class_id is required');

    let scopedCohortId: string | null | undefined = cohortId;

    if (role === 'admin') {
      await this.assertTutorOwnsClass(classId, userId, role);
      if (cohortId) {
        await assertCohortBelongsToClass(this.supabase, classId, cohortId);
      }
    } else if (role === 'tutor') {
      const cohort = await getTutorCohortForClass(
        this.supabase,
        classId,
        userId,
      );
      if (cohortId && cohortId !== cohort.id) throw new ForbiddenException();
      scopedCohortId = cohort.id;
    } else {
      const enrollment = await this.assertStudentEnrolled(classId, userId);
      if (cohortId && cohortId !== enrollment.cohort_id)
        throw new ForbiddenException();
      scopedCohortId = enrollment.cohort_id;
    }

    let query = this.supabase.adminClient
      .from('modules')
      .select('*, items:module_items(*)')
      .eq('class_id', classId)
      .order('order_index', { ascending: true })
      .order('order_index', {
        ascending: true,
        referencedTable: 'module_items',
      });

    if (role === 'admin' && cohortId) {
      query = query.eq('cohort_id', cohortId);
    } else if (role !== 'admin') {
      query = scopedCohortId
        ? query.or(`cohort_id.is.null,cohort_id.eq.${scopedCohortId}`)
        : query.is('cohort_id', null);
    }

    const { data, error } = await query;

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  // ----------------------------------------------------------------
  // POST /modules
  // ----------------------------------------------------------------
  async create(tutorId: string, role: string | null, dto: CreateModuleDto) {
    await this.assertTutorOwnsClass(dto.class_id, tutorId, role);
    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        dto.class_id,
        dto.cohort_id,
      );
    }

    const { data, error } = await this.supabase.adminClient
      .from('modules')
      .insert({
        class_id: dto.class_id,
        title: dto.title,
        order_index: dto.order_index,
        cohort_id: dto.cohort_id ?? null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ----------------------------------------------------------------
  // PATCH /modules/:id
  // ----------------------------------------------------------------
  async update(
    moduleId: string,
    tutorId: string,
    role: string | null,
    dto: UpdateModuleDto,
  ) {
    const mod = await this.assertTutorOwnsModule(moduleId, tutorId, role);
    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        mod.class_id,
        dto.cohort_id,
      );
    }

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
  async remove(moduleId: string, tutorId: string, role: string | null) {
    await this.assertTutorOwnsModule(moduleId, tutorId, role);

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
    role: string | null,
    dto: CreateModuleItemDto,
    file?: Express.Multer.File,
  ) {
    this.logger.log(
      `createItem called - moduleId=${moduleId}, type=${dto.type}, hasFile=${!!file}`,
    );

    const mod = await this.assertTutorOwnsModule(moduleId, tutorId, role);
    let contentUrl = dto.content_url ?? null;

    if (dto.type === 'pdf') {
      if (!file) throw new BadRequestException('PDF file is required');
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are accepted');
      }
      if (file.size > MAX_MODULE_PDF_SIZE) {
        throw new BadRequestException('PDF file must be under 25 MB');
      }

      this.logger.log(
        `Uploading PDF - filename=${file.originalname}, size=${file.buffer.length}`,
      );
      // Sanitize filename: remove special characters, replace spaces with underscores
      const sanitized = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/\s+/g, '_');
      const path = `${mod.class_id}/${Date.now()}_${sanitized}`;
      const { error: uploadError } = await this.supabase.adminClient.storage
        .from('modules')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        this.logger.error(
          `Supabase upload error: ${JSON.stringify(uploadError)}`,
        );
        throw new BadRequestException(uploadError.message);
      }

      const { data: urlData } = this.supabase.adminClient.storage
        .from('modules')
        .getPublicUrl(path);

      contentUrl = urlData.publicUrl;
      this.logger.log(`File uploaded successfully - url=${contentUrl}`);
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
    role: string | null,
    dto: UpdateModuleItemDto,
  ) {
    await this.assertTutorOwnsItem(itemId, tutorId, role);

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
  async removeItem(itemId: string, tutorId: string, role: string | null) {
    const item = await this.assertTutorOwnsItem(itemId, tutorId, role);

    // Delete storage file for PDFs
    if (item.type === 'pdf' && item.content_url) {
      const storagePath = (item.content_url as string).replace(
        this.storageUrl,
        '',
      );
      if (storagePath) {
        await this.supabase.adminClient.storage
          .from('modules')
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
  async reorderItems(
    moduleId: string,
    tutorId: string,
    role: string | null,
    dto: ReorderItemsDto,
  ) {
    await this.assertTutorOwnsModule(moduleId, tutorId, role);

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
      .order('order_index', {
        ascending: true,
        referencedTable: 'module_items',
      })
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
