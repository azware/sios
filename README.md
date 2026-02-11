# SIOS - Sistem Informasi Operasional Sekolah (School Operational Information System)

**Status: Full Stack Ready (Backend + Frontend)**

## Project Overview
SIOS adalah aplikasi Sistem Informasi Operasional Sekolah untuk mengelola data siswa, guru, kelas, sekolah, kehadiran, nilai, dan pembayaran secara terintegrasi.

## Tech Stack

### Backend
- Runtime: Node.js
- Language: TypeScript
- Framework: Express.js
- Database: PostgreSQL 15
- ORM: Prisma
- Authentication: JWT + Bcrypt

### Frontend
- Framework: Next.js 14
- Language: React + TypeScript
- Styling: Tailwind CSS
- HTTP Client: Axios

### Infrastructure
- Docker (PostgreSQL)
- Port: 4000 (Backend), 3000 (Frontend), 5432 (Database)

## Key Features
- CRUD: Students, Teachers, Classes, Subjects, Schools, Attendance, Grades, Payments
- Authentication: JWT login/register
- Role-based UI and route protection (frontend)
- Detail pages (student/teacher/class/school)
- Search, sort, pagination on list pages
- Unique conflict feedback (NIS/NISN/email/code/name)

## Project Structure (High Level)
```
sios/
  backend/
  frontend/
  docker-compose.yml
  README.md
  PROJECT_STATUS.md
```

## API Endpoints (Summary)
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Students: `/api/students`
- Teachers: `/api/teachers`
- Classes: `/api/classes`
- Subjects: `/api/subjects`
- Schools: `/api/schools`
- Users: `/api/users?role=ADMIN|TEACHER|STUDENT|PARENT` (ADMIN only)
- Attendance: `/api/attendance`
- Grades: `/api/grades`
- Payments: `/api/payments`

## Getting Started

### Prerequisites
- Docker Desktop
- Node.js v18+
- npm v9+

### Run Locally
1. Database
```bash
cd d:\projects\sios
docker compose -f docker-compose.yml up -d db
```

2. Environment Variables
```bash
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
```

3. Backend
```bash
cd d:\projects\sios\backend
npm install
npm run dev
```

4. Frontend
```bash
cd d:\projects\sios\frontend
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:4000/api

## Testing
```bash
powershell -ExecutionPolicy Bypass -File backend\test-comprehensive.ps1
```

## Notes
- Backend tetap menjadi sumber otoritas akses (RBAC).
- Validasi unik mengembalikan status 409 + field yang konflik.

## Project Status
**Current Phase**: Full Stack Ready (Backend + Frontend)
**Current Version**: 0.2.0
**Last Updated**: February 10, 2026
