import { Injectable } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';

@Injectable()
export class ReportsService {
  constructor(private prismaAcademic: PrismaAcademicService) { }

  // PASO 4: Reporte con consulta SQL nativa
  async getStudentEnrollmentReport() {
    const result = await this.prismaAcademic.$queryRaw<Array<{
      student_name: string;
      career_name: string;
      total_subjects: bigint;
    }>>`
      SELECT 
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        c.name AS career_name,
        COUNT(ss.id) AS total_subjects
      FROM students s
      INNER JOIN careers c ON s.career_id = c.id
      LEFT JOIN student_subjects ss ON s.id = ss.student_id
      GROUP BY s.id, s.first_name, s.last_name, c.name
      ORDER BY total_subjects DESC
    `;

    // Convertir BigInt a Number para evitar error de serialización JSON
    return result.map(item => ({
      ...item,
      total_subjects: Number(item.total_subjects)
    }));
  }
}
