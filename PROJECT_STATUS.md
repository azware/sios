# SIOS Project Status

## Status
- Frontend: RUNNING on http://localhost:3000
- Backend: RUNNING on http://localhost:4000
- Database: RUNNING on localhost:5432 (PostgreSQL via Docker)

## Backend Summary
- Express + Prisma with JWT auth
- CRUD modules: Students, Teachers, Classes, Subjects, Schools, Attendance, Grades, Payments
- Admin-only endpoints: `/api/schools`, `/api/users?role=...`
- Unique conflict handling (409 + field)
- Health endpoints: `/api/health` (liveness), `/api/health/ready` (DB readiness)

## Frontend Summary
- Next.js 14 + Tailwind
- CRUD forms (create/edit) for Students, Teachers, Classes, Subjects, Schools
- Detail pages for Student, Teacher, Class, School
- Search, sort, pagination on list pages
- Role-based menu + route protection

## Recent Changes
- Added Schools module (backend + frontend)
- Added Users listing endpoint (role filter)
- Added detail pages and list pagination/sorting
- Added UI RBAC and route guards
- Added unique conflict feedback in forms
- Added environment templates: `backend/.env.example`, `frontend/.env.local.example`
- Added onboarding wizard for admin (`/dashboard/onboarding`) to setup first school, class, and subject
- Added auto-redirect for admin to onboarding when setup awal belum lengkap
- Added CSV export/import on Subjects, Students, Teachers, and Classes pages
- Added CSV import hardening: template download, dry-run validation, and error report export
- Added DB readiness health check endpoint (`/api/health/ready`)
- Added backup/restore scripts: `scripts/db-backup.ps1`, `scripts/db-restore.ps1`

## Next Steps (Feature Options)
1. Audit log aktivitas admin/user (siapa mengubah apa)
2. Dashboard KPI ringkas (absensi hari ini, tunggakan pembayaran, nilai rata-rata)
3. Notification center (pengingat pembayaran, absensi rendah, nilai kritis)
4. Import history + retry failed rows untuk workflow CSV
5. Testing expansion (unit/integration/e2e) + CI pipeline
