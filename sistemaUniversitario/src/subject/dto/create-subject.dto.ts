import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  credits: number;

  @IsNotEmpty()
  @IsInt()
  careerId: number;

  @IsNotEmpty()
  @IsInt()
  cycleId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableSlots?: number;
}