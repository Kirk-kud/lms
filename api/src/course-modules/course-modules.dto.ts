import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateModuleDto {
  @IsUUID()
  class_id: string;

  @IsString()
  title: string;

  @IsInt()
  @Type(() => Number)
  order_index: number;

  @IsOptional()
  @IsUUID()
  cohort_id?: string;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order_index?: number;

  @IsOptional()
  @IsUUID()
  cohort_id?: string;
}

export class CreateModuleItemDto {
  @IsString()
  title: string;

  @IsIn(['pdf', 'video', 'link', 'text', 'image', 'assignment'])
  type: 'pdf' | 'video' | 'link' | 'text' | 'image' | 'assignment';

  @IsOptional()
  @IsString()
  content_url?: string;

  @IsOptional()
  @IsString()
  content_text?: string;

  /** Required when type is `assignment`; must belong to the same class/cohort as the module. */
  @ValidateIf((o: CreateModuleItemDto) => o.type === 'assignment')
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  assignment_id?: string;

  @IsInt()
  @Type(() => Number)
  order_index: number;
}

export class UpdateModuleItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content_url?: string;

  @IsOptional()
  @IsString()
  content_text?: string;

  /** Only valid for module items with type `assignment`. Omit to leave unchanged. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  assignment_id?: string | null;
}

class ReorderItem {
  @IsUUID()
  item_id: string;

  @IsNumber()
  order_index: number;
}

export class ReorderItemsDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}
