# SIOS Frontend

Modern React/Next.js 14 frontend untuk Sistem Informasi Operasional Sekolah

## Tech Stack

- **Framework**: Next.js 14.2
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Auth**: JWT + Local Storage

## Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx              (Root layout)
│   ├── page.tsx                (Landing page - redirect ke login/dashboard)
│   ├── login/page.tsx          (Login page)
│   ├── register/page.tsx       (Register page)
│   ├── dashboard/
│   │   ├── layout.tsx          (Dashboard layout dengan sidebar)
│   │   ├── page.tsx            (Dashboard overview)
│   │   ├── students/page.tsx   (Student management)
│   │   ├── teachers/page.tsx   (Teacher management)
│   │   ├── classes/page.tsx    (Class management)
│   │   ├── subjects/page.tsx   (Subject management)
│   │   ├── attendance/page.tsx (Attendance tracking)
│   │   ├── grades/page.tsx     (Grades management)
│   │   └── payments/page.tsx   (Payments tracking)
│   └── globals.css             (Global styles)
├── lib/
│   ├── api.ts                  (Axios client dengan interceptors)
│   └── auth.ts                 (Authentication service)
├── .env.local                  (Environment variables)
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── package.json
```

## Features Implemented

### ✅ Authentication
- Login page dengan username & password
- Register page untuk user baru
- JWT token management
- Automatic redirect ke login bila unauthorized
- Logout functionality

### ✅ Dashboard
- Responsive sidebar navigation
- 8 menu items untuk berbagai modul
- Dashboard overview dengan statistics
- Protected routes (hanya bisa akses jika sudah login)

### ✅ Data Management Pages
- **Students**: List, search, view detail functionality
- **Teachers**: List dan view detail
- **Classes**: Card view dengan jumlah siswa
- **Subjects**: Table view dengan kode & deskripsi
- **Attendance**: Basic view dengan counter
- **Grades**: Basic view dengan counter
- **Payments**: Basic view dengan counter

### ✅ UI Components
- Responsive design dengan Tailwind CSS
- Navigation sidebar (collapsible)
- Card components untuk data display
- Form inputs dengan styling terpadu
- Error messaging
- Loading states
- Search/filter functionality

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- Backend API running di http://localhost:4000/api

### Installation

```bash
cd frontend
npm install
```

### Configuration

File: `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Development

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### Build untuk Production

```bash
npm run build
npm run start
```

## API Integration

Frontend menggunakan Axios client dengan:
- Automatic JWT token injection di request headers
- Automatic redirect ke login jika 401 Unauthorized
- Error handling

### API Client (`lib/api.ts`)

```typescript
import apiClient from '@/lib/api'

const response = await apiClient.get('/students')
```

## Authentication Flow

1. User ke `/register` untuk buat akun baru
2. User ke `/login` dengan username & password
3. Backend return JWT token
4. Token disimpan di localStorage
5. Setiap request ke API include token di Authorization header
6. Jika 401, redirect ke `/login`

## Demo Credentials

- **Username**: admin1
- **Password**: admin123

(Dari backend test data)

## Pages Overview

### `/` - Landing Page
- Redirect otomatis ke `/login` jika belum login
- Redirect otomatis ke `/dashboard` jika sudah login

### `/login` - Login Page
- Input username dan password
- Error message handling
- Link ke halaman register

### `/register` - Register Page
- Input username, email, password
- Pilih role (Student, Teacher, Admin, Parent)
- Validasi password match
- Link ke halaman login

### `/dashboard` - Main Dashboard
- Menampilkan statistik (total students, teachers, classes, payments)
- Cards dengan icon dan counter
- Informasi feature highlights
- Quick start guide

### `/dashboard/students` - Student Management
- List semua siswa dengan search
- Filter by nama/NIS/NISN
- Table dengan columns: No, Nama, NIS, NISN, Email, Kelas, Aksi
- Link ke detail dan delete button
- "Tambah Siswa" button

### `/dashboard/teachers` - Teacher Management
- List semua guru
- Table dengan columns: No, Nama, NIP, Email, Telepon, Aksi
- Link ke detail dan delete button
- "Tambah Guru" button

### `/dashboard/classes` - Class Management
- Card grid view
- Menampilkan name, level, jumlah siswa
- "Lihat" dan "Hapus" button

### `/dashboard/subjects` - Subject Management
- Table view
- Columns: Kode, Nama, Deskripsi, Aksi
- "Tambah Mata Pelajaran" button

### `/dashboard/attendance` - Attendance
- Counter total attendance records
- "Tambah Kehadiran" button

### `/dashboard/grades` - Grades
- Counter total grades
- "Tambah Nilai" button

### `/dashboard/payments` - Payments
- Counter total payments
- "Tambah Pembayaran" button

## Styling

Menggunakan Tailwind CSS dengan custom utilities:
- `.btn-primary` - Blue button
- `.btn-secondary` - Gray button
- `.card` - White card dengan shadow
- `.input-field` - Styled input dengan focus state

## Next Steps

1. **Implement Full CRUD**
   - Create, Read, Update, Delete untuk semua entities
   - Form components untuk data entry

2. **Add More Pages**
   - Detail pages untuk students, teachers, classes
   - Create/Edit pages untuk semua entities
   - Report/Export functionality

3. **Enhanced UI**
   - Data tables dengan sorting & pagination
   - Modal dialogs untuk actions
   - Toast notifications
   - Loading spinners

4. **State Management**
   - Implement Context API atau Zustand
   - Global user state
   - API response caching

5. **Advanced Features**
   - Role-based access control (RBAC)
   - Dashboard charts & analytics
   - Export to PDF/Excel
   - Bulk operations
   - Real-time updates dengan WebSocket

## Troubleshooting

### "Cannot connect to API"
- Pastikan backend running di http://localhost:4000
- Check NEXT_PUBLIC_API_URL di .env.local
- Check browser console untuk error details

### "Unauthorized (401)"
- Token mungkin expired atau invalid
- Akan auto-redirect ke login page
- Login ulang

### "Module not found"
- Jalankan `npm install` ulang
- Delete `node_modules` dan `.next` folder
- Run `npm install` dan `npm run dev` lagi

## Development Tips

1. **Hot Reload**: File changes akan auto-reload dev server
2. **TypeScript**: Full type safety untuk API responses
3. **Next.js App Router**: File-based routing system
4. **Tailwind**: Utility-first CSS classes
5. **Axios Interceptors**: Automatic JWT token handling

## Status

**Current Phase**: ✅ Core UI Complete

**Current Version**: 0.1.0

**Last Updated**: February 7, 2026

---

**Frontend Ready!** 🚀

Connected to backend API at http://localhost:4000/api
