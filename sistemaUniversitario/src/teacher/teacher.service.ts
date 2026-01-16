import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { PrismaAuthService } from '../prisma/prisma-auth.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeacherService {
  constructor(
    private prismaAcademic: PrismaAcademicService,
    private prismaAuth: PrismaAuthService,
  ) { }

  create(createTeacherDto: CreateTeacherDto) {
    return this.prismaAcademic.teacher.create({
      data: createTeacherDto,
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.teacher.findMany({
        skip,
        take: limit,
        include: {
          subjects: {
            include: {
              subject: true,
            },
          },
        },
      }),
      this.prismaAcademic.teacher.count(),
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
    const teacher = await this.prismaAcademic.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                career: true,
                cycle: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    await this.findOne(id);

    return this.prismaAcademic.teacher.update({
      where: { id },
      data: updateTeacherDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.teacher.delete({
      where: { id },
    });
  }

  // PASO 2.3: Listar docentes que imparten más de una asignatura
  async findWithMultipleSubjects() {
    const teachers = await this.prismaAcademic.teacher.findMany({
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                career: true,
                cycle: true,
              },
            },
          },
        },
      },
    });

    // Filtrar los que tienen más de 1 asignatura
    return teachers.filter(teacher => teacher.subjects.length > 1);
  }

  // PASO 3.2: Filtrar docentes usando AND, OR, NOT
  async findWithLogicalOperators() {
    // Obtener todos los docentes con sus asignaturas
    const teachers = await this.prismaAcademic.teacher.findMany({
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Filtrar: (isFullTime = true AND tiene asignaturas) OR (usuario NO inactivo en BD AUTH)
    const filteredTeachers: typeof teachers = [];

    for (const teacher of teachers) {
      // Verificar usuario en BD AUTH
      const user = await this.prismaAuth.user.findUnique({
        where: { id: teacher.userId },
      });

      // Condición 1: isFullTime = true AND tiene asignaturas
      const condition1 = teacher.isFullTime && teacher.subjects.length > 0;

      // Condición 2: usuario NO inactivo (es decir, usuario activo o no existe)
      const condition2 = !user || user.isActive;

      // Aplicar OR entre las condiciones
      if (condition1 || condition2) {
        filteredTeachers.push(teacher);
      }
    }

    return filteredTeachers;
  }
}