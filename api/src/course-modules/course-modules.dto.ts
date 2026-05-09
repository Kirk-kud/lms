import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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

  @IsIn(['pdf', 'video', 'link', 'text', 'image'])
  type: 'pdf' | 'video' | 'link' | 'text' | 'image';

  @IsOptional()
  @IsString()
  content_url?: string;

  @IsOptional()
  @IsString()
  content_text?: string;

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
