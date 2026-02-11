# SIOS Backend API Documentation

## Base URL
```
http://localhost:4000/api
```

## Endpoints

### Authentication Routes (`/auth`)

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "ADMIN|TEACHER|STUDENT|PARENT" (optional, default: "STUDENT")
}

Response: 201 Created
{
  "id": number,
  "username": string,
  "email": string,
  "role": string
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "token": "jwt_token",
  "user": {
    "id": number,
    "username": string,
    "email": string,
    "role": string
  }
}
```

---

### Students Routes (`/students`)

#### Get All Students
```
GET /students

Response: 200 OK
[
  {
    "id": number,
    "nis": string,
    "nisn": string,
    "name": string,
    "email": string,
    "phone": string,
    "dateOfBirth": date,
    "gender": string,
    "address": string,
    "classId": number,
    "schoolId": number,
    "userId": number,
    "class": {...},
    "user": {...},
    "attendances": [...],
    "grades": [...],
    "payments": [...]
  }
]
```

#### Get Student by ID
```
GET /students/:id

Response: 200 OK
{ student object }
```

#### Create Student
```
POST /students
Content-Type: application/json

{
  "nis": "string" (required),
  "nisn": "string" (required),
  "name": "string" (required),
  "email": "string" (required),
  "phone": "string",
  "dateOfBirth": "ISO date string",
  "gender": "MALE|FEMALE",
  "address": "string",
  "classId": number (required),
  "schoolId": number (required),
  "userId": number (required)
}

Response: 201 Created
{ student object }
```

#### Update Student
```
PUT /students/:id
Content-Type: application/json

{
  "nis": "string",
  "nisn": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "ISO date string",
  "gender": "MALE|FEMALE",
  "address": "string",
  "classId": number
}

Response: 200 OK
{ updated student object }
```

#### Delete Student
```
DELETE /students/:id

Response: 200 OK
{ "message": "Siswa berhasil dihapus" }
```

---

### Teachers Routes (`/teachers`)

#### Get All Teachers
```
GET /teachers

Response: 200 OK
[ array of teacher objects ]
```

#### Get Teacher by ID
```
GET /teachers/:id

Response: 200 OK
{ teacher object with relations }
```

#### Create Teacher
```
POST /teachers
Content-Type: application/json

{
  "nip": "string" (required),
  "name": "string" (required),
  "email": "string" (required),
  "phone": "string",
  "schoolId": number (required),
  "userId": number (required)
}

Response: 201 Created
{ teacher object }
```

#### Update Teacher
```
PUT /teachers/:id

{
  "nip": "string",
  "name": "string",
  "email": "string",
  "phone": "string"
}

Response: 200 OK
{ updated teacher object }
```

#### Delete Teacher
```
DELETE /teachers/:id

Response: 200 OK
{ "message": "Guru berhasil dihapus" }
```

---

### Classes Routes (`/classes`)

#### Get All Classes
```
GET /classes

Response: 200 OK
[ array of class objects ]
```

#### Get Class by ID
```
GET /classes/:id

Response: 200 OK
{ class object with students and schedules }
```

#### Create Class
```
POST /classes
Content-Type: application/json

{
  "name": "string" (required, e.g., "10A"),
  "level": "string" (required, e.g., "10"),
  "schoolId": number (required)
}

Response: 201 Created
{ class object }
```

#### Update Class
```
PUT /classes/:id

{
  "name": "string",
  "level": "string"
}

Response: 200 OK
{ updated class object }
```

#### Delete Class
```
DELETE /classes/:id

Response: 200 OK
{ "message": "Kelas berhasil dihapus" }
```

---

### Subjects Routes (`/subjects`)

#### Get All Subjects
```
GET /subjects

Response: 200 OK
[ array of subject objects ]
```

#### Get Subject by ID
```
GET /subjects/:id

Response: 200 OK
{ subject object with teachers, schedules, and grades }
```

#### Create Subject
```
POST /subjects
Content-Type: application/json

{
  "code": "string" (required, e.g., "MTH-101"),
  "name": "string" (required, e.g., "Mathematics"),
  "description": "string"
}

Response: 201 Created
{ subject object }
```

#### Update Subject
```
PUT /subjects/:id

{
  "code": "string",
  "name": "string",
  "description": "string"
}

Response: 200 OK
{ updated subject object }
```

#### Delete Subject
```
DELETE /subjects/:id

Response: 200 OK
{ "message": "Mata pelajaran berhasil dihapus" }
```

---

### Attendance Routes (`/attendance`)

#### Get All Attendance Records
```
GET /attendance

Response: 200 OK
[ array of attendance objects ]
```

#### Get Attendance by Student ID
```
GET /attendance/student/:studentId

Response: 200 OK
[ array of attendance records for student ]
```

#### Create Attendance Record
```
POST /attendance
Content-Type: application/json

{
  "studentId": number (required),
  "date": "ISO date string" (required),
  "status": "PRESENT|ABSENT|LATE|SICK|PERMITTED" (required),
  "note": "string"
}

Response: 201 Created
{ attendance object }
```

#### Update Attendance
```
PUT /attendance/:id

{
  "status": "PRESENT|ABSENT|LATE|SICK|PERMITTED",
  "note": "string"
}

Response: 200 OK
{ updated attendance object }
```

#### Delete Attendance
```
DELETE /attendance/:id

Response: 200 OK
{ "message": "Data kehadiran berhasil dihapus" }
```

---

### Grades Routes (`/grades`)

#### Get All Grades
```
GET /grades

Response: 200 OK
[ array of grade objects ]
```

#### Get Grades by Student ID
```
GET /grades/student/:studentId

Response: 200 OK
[ array of grades for student ]
```

#### Get Grades by Subject ID
```
GET /grades/subject/:subjectId

Response: 200 OK
[ array of grades for subject ]
```

#### Create Grade
```
POST /grades
Content-Type: application/json

{
  "studentId": number (required),
  "subjectId": number (required),
  "teacherId": number (required),
  "score": number (required, 0-100),
  "term": "string" (required, e.g., "1", "2"),
  "academicYear": "string" (required, e.g., "2023/2024")
}

Response: 201 Created
{ grade object }
```

#### Update Grade
```
PUT /grades/:id

{
  "score": number (required)
}

Response: 200 OK
{ updated grade object }
```

#### Delete Grade
```
DELETE /grades/:id

Response: 200 OK
{ "message": "Nilai berhasil dihapus" }
```

---

### Payments Routes (`/payments`)

#### Get All Payments
```
GET /payments

Response: 200 OK
[ array of payment objects ]
```

#### Get Payments by Student ID
```
GET /payments/student/:studentId

Response: 200 OK
[ array of payments for student ]
```

#### Create Payment
```
POST /payments
Content-Type: application/json

{
  "studentId": number (required),
  "amount": number (required),
  "description": "string" (required),
  "dueDate": "ISO date string" (required)
}

Response: 201 Created
{
  "id": number,
  "studentId": number,
  "amount": number,
  "description": string,
  "dueDate": date,
  "paidAt": null,
  "status": "PENDING",
  "createdAt": date,
  "updatedAt": date
}
```

#### Update Payment (Mark as Paid)
```
PUT /payments/:id

{
  "status": "PENDING|PAID|OVERDUE",
  "paidAt": "ISO date string" (optional)
}

Response: 200 OK
{ updated payment object }
```

#### Delete Payment
```
DELETE /payments/:id

Response: 200 OK
{ "message": "Pembayaran berhasil dihapus" }
```

---

### Health Check

#### Health Status
```
GET /health

Response: 200 OK
{ "status": "ok" }
```

---

## Error Handling

All endpoints return error responses in the following format:

```json
{
  "error": "Error description in Indonesian"
}
```

Common HTTP Status Codes:
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Missing required fields or invalid input
- `401 Unauthorized` - Invalid credentials
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Testing with cURL

### Register a new user
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "STUDENT"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Get all students
```bash
curl -X GET http://localhost:4000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Environment Variables

Create a `.env` file in the backend directory with:

```
DATABASE_URL="postgresql://schooluser:schoolpass@localhost:5432/schooldb"
JWT_SECRET="your_jwt_secret_key_here_change_in_production"
NODE_ENV="development"
PORT=4000
```
