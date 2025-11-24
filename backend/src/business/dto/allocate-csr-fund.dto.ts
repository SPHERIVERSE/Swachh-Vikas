import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AllocateCsrFundDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  purpose?: string; // optional
}

