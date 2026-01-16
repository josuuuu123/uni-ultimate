
# Sistema Universitario - API REST

API REST desarrollada con NestJS y Prisma para la gestión de un sistema universitario, incluyendo especialidades, carreras, ciclos, materias, estudiantes y profesores.

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Modelo de Datos](#modelo- de-datos)
- [Endpoints](#endpoints)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Scripts Disponibles](#scripts-disponibles)

## Tecnologías

- **NestJS 11+** - Framework de Node.js
- **Prisma 7+** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **TypeScript** - Lenguaje de programación
- **class-validator** - Validación de DTOs

## Requisitos Previos

- Node.js 18+ y npm
- Base de datos PostgreSQL (local o remota)
- Git

## Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-repositorio>
cd project_su
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
```
Asegurarse de configurar `DATABASE_ACADEMIC_URL`, `DATABASE_AUTH_URL` y `DATABASE_SUPPORT_URL`.

4. **Configuración Automática de Base de Datos:**
Este comando generará los clientes de Prisma, creará las tablas y poblará los datos iniciales (Seed) de una sola vez:
```bash
npm run db:init
```

5. **Iniciar el servidor:**
```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:3000`

## Configuración

### Archivo .env

Se requiere configurar las URLs de conexión para las tres bases de datos modulares:
- `DATABASE_ACADEMIC_URL`
- `DATABASE_AUTH_URL`
- `DATABASE_SUPPORT_URL`

### Prisma Studio

Para visualizar y gestionar la base de datos académica:
```bash
npx prisma studio --config prisma-academic.config.ts
```

## Estructura del Proyecto

```
src/
├── prisma/             # Módulo de Prisma (Múltiples DBs: Academic, Auth, Support)
├── user/               # Módulo de usuarios
├── specialty/          # Módulo de especialidades
├── career/             # Módulo de carreras
├── cycle/              # Módulo de ciclos
├── subject/            # Módulo de materias (con cupos disponibles)
├── teacher/            # Módulo de profesores
├── student/            # Módulo de estudiantes
├── student-subject/    # Módulo de matriculación (Transaccional ACID)
├── reports/            # Módulo de reportes (SQL Nativo)
├── app.module.ts
└── main.ts
```

## Modelo de Datos

### Relaciones principales:

- Specialty (1) -> (N) Career
- Career (1) -> (N) Subject
- Career (1) -> (N) Student
- Cycle (1) -> (N) Subject
- Teacher (N) <-> (N) Subject (TeacherSubject)
- Student (N) <-> (N) Subject (StudentSubject)

## Endpoints

### Users
- POST /users - Crear usuario
- GET /users - Listar usuarios

### Students
- POST /students - Crear estudiante
- GET /students - Listar estudiantes
- GET /students/active - Estudiantes con usuario activo
- GET /students/filter - Buscar con filtros (careerId, academicPeriod)

### Subjects
- POST /subjects - Crear materia
- GET /subjects - Listar materias
- GET /subjects/career/:careerId - Materias por carrera

### Teachers
- POST /teachers - Crear profesor
- GET /teachers - Listar profesores
- GET /teachers/multiple-subjects - Docentes con mas de 1 asignatura

### Matriculación (Student-Subjects)
- POST /student-subjects/enroll - Matriculación TRANSACCIONAL (Garantía ACID)
- GET /student-subjects/student/:studentId/period/:academicPeriod - Buscar matrícula

## Scripts Disponibles

- `npm run start:dev`: Inicia servidor en modo desarrollo.
- `npm run build`: Compila el proyecto.
- `npm run db:init`: Configuración completa (Generar tipos + Sincronizar tablas + Seeding).
- `npm run db:seed`: Puebla la base de datos con datos de prueba manualmente.
- `npm run prisma:generate`: Solo genera los clientes de Prisma.
- `npm run db:migrate:academic`: Migraciones específicas para el módulo académico.
- `npm run db:migrate:auth`: Migraciones específicas para el módulo de auth.

## Validaciones

Todas las peticiones POST son validadas automáticamente con `class-validator`:
- Email: Debe ser un email válido.
- Strings: No pueden estar vacíos.
- IDs: Deben ser números enteros.

## Manejo de Errores

La API devuelve errores HTTP estándar:
- 400: Bad Request (validación fallida)
- 404: Not Found (recurso no encontrado)
- 409: Conflict (duplicados o conflicto de negocio)
- 500: Internal Server Error

## Orden de Creación Recomendado

1. Specialties
2. Cycles
3. Careers
4. Subjects
5. Teachers/Users
6. Students

## Licencia

Este proyecto fue desarrollado como parte de un proyecto académico.

---

**Desarrollado por:** Daniel Padilla  
**Institución:** Instituto Sudamericano  
**Fecha:** Enero 2026
