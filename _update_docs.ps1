$bt = [char]96

$readmePath = 'd:\projects\sios\README.md'
$readme = Get-Content -Raw $readmePath

$readme = [regex]::Replace($readme, '(?m)^\*\*Status:.*\*\*$', '**Status: Full Stack Ready (Backend + Frontend)**')
$readme = $readme -replace 'data siswa, guru, kelas,', 'data siswa, guru, kelas, sekolah,'
$readme = $readme -replace '### 8 Route Modules with Full CRUD Operations', '### 10 Route Modules with CRUD Operations'

$paymentsReplacement = @(
  "#### 8. Payments ${bt}/api/payments${bt}",
  "- ${bt}GET /${bt} - List all payments",
  "- ${bt}GET /student/:studentId${bt} - Get student payments",
  "- ${bt}POST /${bt} - Create payment",
  "- ${bt}PUT /:id${bt} - Update payment",
  "- ${bt}DELETE /:id${bt} - Delete payment",
  '',
  "#### 9. Schools ${bt}/api/schools${bt}",
  "- ${bt}GET /${bt} - List all schools",
  "- ${bt}GET /:id${bt} - Get school detail",
  "- ${bt}POST /${bt} - Create school",
  "- ${bt}PUT /:id${bt} - Update school",
  "- ${bt}DELETE /:id${bt} - Delete school",
  '',
  "#### 10. Users ${bt}/api/users${bt}",
  "- ${bt}GET /?role=ADMIN|TEACHER|STUDENT|PARENT${bt} - List users by role (ADMIN only)"
) -join "`n"

$readme = [regex]::Replace(
  $readme,
  '(?s)#### 8\. Payments .*?Delete payment',
  $paymentsReplacement
)

$readme = [regex]::Replace($readme, '### .*Complete', '### Complete', 1)
$readme = $readme -replace '- Subject management', ('- Subject management' + "`n" + '- School management')
$readme = $readme -replace '- TypeScript type safety', ('- TypeScript type safety' + "`n" + '- Frontend CRUD forms (create/edit) with detail pages' + "`n" + '- Frontend role-based UI + route protection' + "`n" + '- Search, sort, pagination on list pages')
$readme = $readme -replace '- Error handling and validation', '- Error handling and validation (including unique conflict feedback)'

$nextStepsReplacement = @(
  '### Recommended Next Steps',
  '1. **Analytics & Reports** - Attendance, grade, payment summaries',
  '2. **Testing** - Add unit and integration tests',
  '3. **Deployment** - Setup production environment',
  '4. **API Documentation** - Interactive swagger/OpenAPI docs',
  '',
  '## Environment Configuration'
) -join "`n"

$readme = [regex]::Replace($readme, '(?s)### .*Recommended Next Steps.*?## Environment Configuration', $nextStepsReplacement)
$readme = $readme -replace '\* Authentication middleware not yet implemented on routes \(recommended to add\)\r?\n', ''

$readme = $readme -replace '\*\*Current Phase\*\*:.*', '**Current Phase**: Full Stack Ready (Backend + Frontend)'
$readme = $readme -replace '\*\*Current Version\*\*:.*', '**Current Version**: 0.2.0'
$readme = $readme -replace '\*\*Last Updated\*\*:.*', '**Last Updated**: February 10, 2026'

$readme = $readme -replace '\*\*Ready for Development!\*\*.*', '**Ready for Development!**'
$readme = [regex]::Replace(
  $readme,
  'The backend is fully functional and ready for:(?s).*',
  ('The full stack is functional and ready for:' + "`n" + '- Additional features' + "`n" + '- Production deployment' + "`n" + '- Team collaboration')
)

Set-Content -Path $readmePath -Value $readme

$statusPath = 'd:\projects\sios\PROJECT_STATUS.md'
$status = Get-Content -Raw $statusPath

$status = $status -replace 'routes/\s*\(8 API modules\)', 'routes/ (10 API modules)'
$status = $status -replace 'API Endpoints \(8 Modules\)', 'API Endpoints (10 Modules)'
$status = $status -replace '\| Payments \| GET, GET/student/:id, POST, PUT, DELETE \| CRUD \|', ('| Payments | GET, GET/student/:id, POST, PUT, DELETE | CRUD |' + "`n" + '| Schools | GET, GET/:id, POST, PUT, DELETE | CRUD |' + "`n" + '| Users | GET?role=... | Read |')

$status = $status -replace '/dashboard/subjects\s+- Subject management table', ('/dashboard/subjects - Subject management table' + "`n" + '- /dashboard/schools - School management list' + "`n" + '- /dashboard/schools/new - Create school' + "`n" + '- /dashboard/schools/:id - Edit school' + "`n" + '- /dashboard/schools/:id/detail - School detail')

$featuresReplacement = @(
  '### Features',
  '- JWT-based authentication',
  '- Input validation & error handling (unique conflict feedback)',
  '- Database relations & constraints',
  '- Enum types for role & status',
  '- Automatic timestamp management',
  '- Role-based data structure',
  '- Role-based UI + route protection (frontend)',
  '- Detail pages for student/teacher/class/school',
  '- Search, sort, pagination on list pages',
  '',
  '### Testing'
) -join "`n"

$status = [regex]::Replace($status, '(?s)### .*Features.*?### .*Testing', $featuresReplacement)

$phase2Replacement = @(
  '### Phase 2: Enhanced CRUD Operations',
  '1. **Advanced CRUD**',
  '   - Bulk import/export',
  '   - CSV export',
  '2. **Role-Based Portals**',
  '   - Teacher portal',
  '   - Student portal',
  '',
  '### Phase 3'
) -join "`n"

$status = [regex]::Replace($status, '(?s)### Phase 2: Enhanced CRUD Operations.*?### Phase 3', $phase2Replacement)

Set-Content -Path $statusPath -Value $status
