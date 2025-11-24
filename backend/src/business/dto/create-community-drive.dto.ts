import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateCommunityDriveDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

    // ADD THESE TWO PROPERTIES
  @IsString()
  @IsNotEmpty() // Assuming start/end dates are mandatory for a drive
  startDate: string; 

  @IsString()
  @IsNotEmpty()
  endDate: string;
}
