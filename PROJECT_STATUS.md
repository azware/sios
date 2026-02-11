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

## Next Steps
1. Onboarding wizard (first school + initial admin/class)
2. CSV export/import
3. Advanced reports and analytics
4. Testing expansion (unit/integration)
