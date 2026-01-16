import { PrismaClient as AcademicClient } from '@prisma/client-academic';
import { PrismaClient as AuthClient } from '@prisma/client-auth';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const academicPool = new Pool({ connectionString: process.env.DATABASE_ACADEMIC_URL });
const authPool = new Pool({ connectionString: process.env.DATABASE_AUTH_URL });

const prismaAcademic = new AcademicClient({ adapter: new PrismaPg(academicPool) });
const prismaAuth = new AuthClient({ adapter: new PrismaPg(authPool) });

async function main() {
    console.log('Starting seed...');

    // --- SEED AUTH DB ---
    console.log('Seeding Auth Database...');

    // Roles
    const adminRole = await prismaAuth.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
            name: 'ADMIN',
            description: 'System Administrator',
        },
    });

    const studentRole = await prismaAuth.role.upsert({
        where: { name: 'STUDENT' },
        update: {},
        create: {
            name: 'STUDENT',
            description: 'University Student',
        },
    });

    const teacherRole = await prismaAuth.role.upsert({
        where: { name: 'TEACHER' },
        update: {},
        create: {
            name: 'TEACHER',
            description: 'University Teacher',
        },
    });

    // Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminUser = await prismaAuth.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@universidad.edu',
            name: 'Admin User',
            password: hashedPassword,
            roles: {
                create: { roleId: adminRole.id }
            }
        },
    });

    const studentUser = await prismaAuth.user.upsert({
        where: { username: 'estudiante1' },
        update: {},
        create: {
            username: 'estudiante1',
            email: 'estudiante1@universidad.edu',
            name: 'Juan Perez',
            password: hashedPassword,
            roles: {
                create: { roleId: studentRole.id }
            }
        },
    });

    // --- SEED ACADEMIC DB ---
    console.log('Seeding Academic Database...');

    // Specialties
    const ingSpecialty = await prismaAcademic.specialty.upsert({
        where: { name: 'Ingeniería y Tecnología' },
        update: {},
        create: {
            name: 'Ingeniería y Tecnología',
            description: 'Facultad de ingenierías',
        },
    });

    // Careers
    const softwareCareer = await prismaAcademic.career.upsert({
        where: { name: 'Ingeniería en Software' },
        update: {},
        create: {
            name: 'Ingeniería en Software',
            totalCycles: 10,
            durationYears: 5,
            specialtyId: ingSpecialty.id,
        },
    });

    // Cycles
    for (let i = 1; i <= 10; i++) {
        await prismaAcademic.cycle.upsert({
            where: { number: i },
            update: {},
            create: {
                number: i,
                name: `Ciclo ${i}`,
            },
        });
    }

    // Student (Linked to Auth User)
    await prismaAcademic.student.upsert({
        where: { userId: studentUser.id },
        update: {},
        create: {
            userId: studentUser.id,
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'estudiante1@universidad.edu',
            careerId: softwareCareer.id,
        },
    });

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prismaAcademic.$disconnect();
        await prismaAuth.$disconnect();
        await academicPool.end();
        await authPool.end();
    });

