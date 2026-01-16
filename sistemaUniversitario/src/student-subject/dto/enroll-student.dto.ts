import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class EnrollStudentDto {
    @IsNotEmpty()
    @IsInt()
    studentId: number;

    @IsNotEmpty()
    @IsInt()
    subjectId: number;

    @IsNotEmpty()
    @IsString()
    academicPeriod: string;
}
