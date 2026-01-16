import { IsInt, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';

export class CreateStudentSubjectDto {
  @IsNotEmpty()
  @IsInt()
  studentId: number;

  @IsNotEmpty()
  @IsInt()
  subjectId: number;

  @IsNotEmpty()
  @IsString()
  academicPeriod: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  grade?: number;

  @IsOptional()
  @IsBoolean()
  passed?: boolean;
}