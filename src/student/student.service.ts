import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { PrismaAuthService } from '../prisma/prisma-auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(
    private prismaAcademic: PrismaAcademicService,
    private prismaAuth: PrismaAuthService,
  ) { }

  async create(createStudentDto: CreateStudentDto) {
    const career = await this.prismaAcademic.career.findUnique({
      where: { id: createStudentDto.careerId },
    });

    if (!career) {
      throw new BadRequestException(`Career with ID ${createStudentDto.careerId} not found`);
    }

    return this.prismaAcademic.student.create({
      data: createStudentDto,
      include: {
        career: {
          include: {
            specialty: true,
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.student.findMany({
        skip,
        take: limit,
        include: {
          career: {
            include: {
              specialty: true,
            },
          },
        },
      }),
      this.prismaAcademic.student.count(),
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
    const student = await this.prismaAcademic.student.findUnique({
      where: { id },
      include: {
        career: {
          include: {
            specialty: true,
          },
        },
        subjects: {
          include: {
            subject: {
              include: {
                cycle: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id);

    if (updateStudentDto.careerId) {
      const career = await this.prismaAcademic.career.findUnique({
        where: { id: updateStudentDto.careerId },
      });

      if (!career) {
        throw new BadRequestException(`Career with ID ${updateStudentDto.careerId} not found`);
      }
    }

    return this.prismaAcademic.student.update({
      where: { id },
      data: updateStudentDto,
      include: {
        career: {
          include: {
            specialty: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.student.delete({
      where: { id },
    });
  }

  // PASO 2.1: Listar estudiantes activos con su carrera
  async findAllActive() {
    // Obtener todos los estudiantes con su carrera
    const students = await this.prismaAcademic.student.findMany({
      include: {
        career: {
          include: {
            specialty: true,
          },
        },
      },
    });

    // Filtrar solo los que tienen usuario activo en BD AUTH
    const activeStudents: typeof students = [];
    for (const student of students) {
      const user = await this.prismaAuth.user.findUnique({
        where: { id: student.userId },
      });

      if (user && user.isActive) {
        activeStudents.push(student);
      }
    }

    return activeStudents;
  }

  // PASO 3.1: Buscar estudiantes con filtros combinados usando AND
  async findWithFilters(careerId?: number, academicPeriod?: string) {
    // Obtener estudiantes según filtros
    const whereConditions: any = {};

    if (careerId) {
      whereConditions.careerId = careerId;
    }

    const students = await this.prismaAcademic.student.findMany({
      where: whereConditions,
      include: {
        career: {
          include: {
            specialty: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Filtrar por usuario activo AND período académico si se especifica
    const filteredStudents: typeof students = [];
    for (const student of students) {
      // Verificar usuario activo en BD AUTH
      const user = await this.prismaAuth.user.findUnique({
        where: { id: student.userId },
      });

      if (!user || !user.isActive) {
        continue;
      }

      // Si se especifica período académico, verificar que tenga matrícula en ese período
      if (academicPeriod) {
        const hasEnrollmentInPeriod = student.subjects.some(
          (enrollment) => enrollment.academicPeriod === academicPeriod
        );

        if (!hasEnrollmentInPeriod) {
          continue;
        }
      }

      filteredStudents.push(student);
    }

    return filteredStudents;
  }
}