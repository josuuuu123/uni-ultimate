import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { PrismaAuthService } from '../prisma/prisma-auth.service';
import { CreateStudentSubjectDto } from './dto/create-student-subject.dto';
import { UpdateStudentSubjectDto } from './dto/update-student-subject.dto';

@Injectable()
export class StudentSubjectService {
  constructor(
    private prismaAcademic: PrismaAcademicService,
    private prismaAuth: PrismaAuthService,
  ) { }

  async create(createStudentSubjectDto: CreateStudentSubjectDto) {

    const student = await this.prismaAcademic.student.findUnique({
      where: { id: createStudentSubjectDto.studentId },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${createStudentSubjectDto.studentId} not found`);
    }


    const subject = await this.prismaAcademic.subject.findUnique({
      where: { id: createStudentSubjectDto.subjectId },
    });

    if (!subject) {
      throw new BadRequestException(`Subject with ID ${createStudentSubjectDto.subjectId} not found`);
    }


    const existingRelation = await this.prismaAcademic.studentSubject.findUnique({
      where: {
        studentId_subjectId: {
          studentId: createStudentSubjectDto.studentId,
          subjectId: createStudentSubjectDto.subjectId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('Student is already enrolled in this subject');
    }

    return this.prismaAcademic.studentSubject.create({
      data: createStudentSubjectDto,
      include: {
        student: {
          include: {
            career: true,
          },
        },
        subject: {
          include: {
            cycle: true,
            career: true,
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.studentSubject.findMany({
        skip,
        take: limit,
        include: {
          student: {
            include: {
              career: true,
            },
          },
          subject: {
            include: {
              cycle: true,
              career: true,
            },
          },
        },
      }),
      this.prismaAcademic.studentSubject.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const studentSubject = await this.prismaAcademic.studentSubject.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            career: true,
          },
        },
        subject: {
          include: {
            cycle: true,
            career: true,
          },
        },
      },
    });

    if (!studentSubject) {
      throw new NotFoundException(`StudentSubject with ID ${id} not found`);
    }

    return studentSubject;
  }

  async findByStudent(studentId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.studentSubject.findMany({
        where: { studentId },
        skip,
        take: limit,
        include: {
          subject: {
            include: {
              cycle: true,
              career: true,
            },
          },
        },
      }),
      this.prismaAcademic.studentSubject.count({
        where: { studentId },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySubject(subjectId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.studentSubject.findMany({
        where: { subjectId },
        skip,
        take: limit,
        include: {
          student: {
            include: {
              career: true,
            },
          },
        },
      }),
      this.prismaAcademic.studentSubject.count({
        where: { subjectId },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: number, updateStudentSubjectDto: UpdateStudentSubjectDto) {
    await this.findOne(id);

    return this.prismaAcademic.studentSubject.update({
      where: { id },
      data: updateStudentSubjectDto,
      include: {
        student: {
          include: {
            career: true,
          },
        },
        subject: {
          include: {
            cycle: true,
            career: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.studentSubject.delete({
      where: { id },
    });
  }

  // PASO 2.4: Matrículas de un estudiante en un período académico
  async findByStudentAndPeriod(studentId: number, academicPeriod: string) {
    return this.prismaAcademic.studentSubject.findMany({
      where: {
        studentId,
        academicPeriod,
      },
      include: {
        student: {
          include: {
            career: true,
          },
        },
        subject: {
          include: {
            cycle: true,
            career: true,
          },
        },
      },
    });
  }

  // PASO 5: Matriculación con transacción - TODO O NADA
  async enrollStudentTransactional(studentId: number, subjectId: number, academicPeriod: string) {
    return await this.prismaAcademic.$transaction(async (tx) => {
      // 1. Verificar que estudiante exista
      const student = await tx.student.findUnique({
        where: { id: studentId }
      });
      if (!student) {
        throw new NotFoundException(`Estudiante no encontrado (ID: ${studentId})`);
      }

      // 2. Verificar que usuario esté activo en BD AUTH
      const user = await this.prismaAuth.user.findUnique({
        where: { id: student.userId }
      });
      if (!user || !user.isActive) {
        throw new BadRequestException('El estudiante no tiene un usuario activo en el sistema de autenticación');
      }

      // 3. Verificar que asignatura exista y obtener cupos actuales
      const subject = await tx.subject.findUnique({
        where: { id: subjectId }
      });
      if (!subject) {
        throw new NotFoundException(`Asignatura no encontrada (ID: ${subjectId})`);
      }

      // 4. Verificar availableSlots > 0 (VALIDACIÓN CRÍTICA)
      if (subject.availableSlots <= 0) {
        throw new BadRequestException('No hay cupos disponibles para esta asignatura');
      }

      // 5. Verificar que no esté ya matriculado
      const existing = await tx.studentSubject.findUnique({
        where: {
          studentId_subjectId: { studentId, subjectId }
        }
      });
      if (existing) {
        throw new ConflictException('El estudiante ya se encuentra matriculado en esta asignatura');
      }

      // 6. Decrementar cupo PRIMERO (para asegurar el bloqueo en BD)
      const updatedSubject = await tx.subject.update({
        where: { id: subjectId },
        data: {
          availableSlots: {
            decrement: 1
          }
        }
      });

      // 7. Crear la matrícula con la info del subject ya actualizada
      return await tx.studentSubject.create({
        data: {
          studentId,
          subjectId,
          academicPeriod
        },
        include: {
          student: true,
          subject: true
        }
      });
    });
  }
}