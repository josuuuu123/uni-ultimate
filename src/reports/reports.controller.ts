import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    // PASO 4: Endpoint para reporte de matrícula de estudiantes
    @Get('student-enrollment')
    getStudentEnrollmentReport() {
        return this.reportsService.getStudentEnrollmentReport();
    }
}
