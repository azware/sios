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
- Audit log aktivitas perubahan data (admin view)
- Dashboard KPI ringkas (kehadiran hari ini, tunggakan pembayaran, rata-rata nilai)
- Notification center (tunggakan pembayaran, kehadiran non-hadir, nilai kritis)
- Admin onboarding wizard (setup sekolah + kelas pertama)
- CSV export/import untuk modul mata pelajaran, siswa, guru, dan kelas (frontend)
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
- Audit Logs: `/api/audit-logs` (ADMIN only, pagination/filter)
- Dashboard: `/api/dashboard/kpis`
- Notifications: `/api/notifications`
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
- CI otomatis di GitHub Actions:
  - Workflow: `.github/workflows/ci.yml`
  - Job backend: `npm ci`, `npm run prisma:generate`, `npm run build`
  - Job frontend: `npm ci`, `npm run lint`, `npm run build`

## Operational Readiness
- Liveness endpoint: `GET /api/health`
- Readiness endpoint (with DB check): `GET /api/health/ready`
- Backup database (PostgreSQL in Docker):
```bash
powershell -ExecutionPolicy Bypass -File scripts\db-backup.ps1
```
- Restore database dari file dump:
```bash
powershell -ExecutionPolicy Bypass -File scripts\db-restore.ps1 -DumpFile .\backups\schooldb_YYYYMMDD_HHMMSS.sql
```

## CSV Import Notes
- Setiap modul punya tombol `Template CSV` di halaman list untuk unduh format siap pakai.
- Aktifkan `Dry Run` sebelum import untuk validasi CSV tanpa menyimpan data.
- Gunakan tombol `Error CSV` setelah import untuk unduh daftar baris gagal.
- Gunakan tombol `Retry Gagal` untuk memproses ulang baris yang gagal (tanpa upload ulang file di sesi yang sama).
- Riwayat import (20 terakhir per modul) disimpan lokal di browser untuk jejak proses.
- Import diproses paralel terbatas (throttled) agar lebih cepat tanpa membebani API.
- `Subjects` header: `code,name,description`
- `Classes` header: `name,level,schoolId`
- `Teachers` header: `nip,name,email,phone,schoolId,username,password`
- `Students` header: `nis,nisn,name,email,classId,schoolId,username,password`

## Notes
- Backend tetap menjadi sumber otoritas akses (RBAC).
- Validasi unik mengembalikan status 409 + field yang konflik.

## Project Status
**Current Phase**: Full Stack Ready (Backend + Frontend)
**Current Version**: 0.4.0
**Last Updated**: February 12, 2026
