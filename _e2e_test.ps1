$ts = Get-Date -Format 'yyyyMMddHHmmss'
$adminUser = 'admin_e2e_' + $ts
$adminEmail = $adminUser + '@sios.local'
$password = 'Admin123!'

$adminReg = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/register -ContentType 'application/json' -Body ( @{ username=$adminUser; email=$adminEmail; password=$password; role='ADMIN' } | ConvertTo-Json )
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login -ContentType 'application/json' -Body ( @{ username=$adminUser; password=$password } | ConvertTo-Json )
$token = $login.token
$headers = @{ Authorization = 'Bearer ' + $token }

$school = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/schools -Headers $headers -ContentType 'application/json' -Body ( @{ name=('Sekolah E2E ' + $ts); email=('sekolah' + $ts + '@sios.local'); phone='021123456'; address='Alamat E2E' } | ConvertTo-Json )
Write-Output ('SCHOOL_ID=' + $school.id)

$teacherUser = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/register -ContentType 'application/json' -Body ( @{ username=('teacher_e2e_' + $ts); email=('teacher' + $ts + '@sios.local'); password=$password; role='TEACHER' } | ConvertTo-Json )
$studentUser = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/register -ContentType 'application/json' -Body ( @{ username=('student_e2e_' + $ts); email=('student' + $ts + '@sios.local'); password=$password; role='STUDENT' } | ConvertTo-Json )

$class = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/classes -Headers $headers -ContentType 'application/json' -Body ( @{ name=('10A-' + $ts); level='10'; schoolId=$school.id } | ConvertTo-Json )
Write-Output ('CLASS_ID=' + $class.id)

$teacher = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/teachers -Headers $headers -ContentType 'application/json' -Body ( @{ nip=('NIP' + $ts); name=('Guru E2E ' + $ts); email=$teacherUser.email; phone='081234567'; schoolId=$school.id; userId=$teacherUser.id } | ConvertTo-Json )
Write-Output ('TEACHER_ID=' + $teacher.id)

$student = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/students -Headers $headers -ContentType 'application/json' -Body ( @{ nis=('NIS' + $ts); nisn=('NISN' + $ts); name=('Siswa E2E ' + $ts); email=$studentUser.email; phone='081234567'; gender='FEMALE'; address='Alamat E2E'; classId=$class.id; schoolId=$school.id; userId=$studentUser.id } | ConvertTo-Json )
Write-Output ('STUDENT_ID=' + $student.id)
