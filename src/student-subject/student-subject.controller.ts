import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { StudentSubjectService } from './student-subject.service';
import { CreateStudentSubjectDto } from './dto/create-student-subject.dto';
import { UpdateStudentSubjectDto } from './dto/update-student-subject.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@Controller('student-subjects')
export class StudentSubjectController {
  constructor(private readonly studentSubjectService: StudentSubjectService) { }

  @Post()
  create(@Body() createStudentSubjectDto: CreateStudentSubjectDto) {
    return this.studentSubjectService.create(createStudentSubjectDto);
  }

  // PASO 5: Endpoint para matriculación transaccional
  @Post('enroll')
  enrollStudentTransactional(@Body() enrollStudentDto: EnrollStudentDto) {
    return this.studentSubjectService.enrollStudentTransactional(
      enrollStudentDto.studentId,
      enrollStudentDto.subjectId,
      enrollStudentDto.academicPeriod,
    );
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.studentSubjectService.findAll(parseInt(page), parseInt(limit));
  }

  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.studentSubjectService.findByStudent(studentId, parseInt(page), parseInt(limit));
  }

  // PASO 2.4: Endpoint para matrículas por estudiante y período
  @Get('student/:studentId/period/:academicPeriod')
  findByStudentAndPeriod(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('academicPeriod') academicPeriod: string,
  ) {
    return this.studentSubjectService.findByStudentAndPeriod(studentId, academicPeriod);
  }

  @Get('subject/:subjectId')
  findBySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.studentSubjectService.findBySubject(subjectId, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentSubjectService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentSubjectDto: UpdateStudentSubjectDto,
  ) {
    return this.studentSubjectService.update(id, updateStudentSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentSubjectService.remove(id);
  }
}