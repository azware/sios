$ts = Get-Date -Format 'yyyyMMddHHmmss'
$user = 'admin_test_' + $ts
$email = $user + '@sios.local'
$password = 'Admin123!'

$register = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/register -ContentType 'application/json' -Body ( @{ username=$user; email=$email; password=$password; role='ADMIN' } | ConvertTo-Json )
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login -ContentType 'application/json' -Body ( @{ username=$user; password=$password } | ConvertTo-Json )
$token = $login.token
$headers = @{ Authorization = 'Bearer ' + $token }
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $token)
$schoolId = 2
$testPassword = 'Admin123!'

Write-Output ('LOGIN_OK=' + $user)

function Test-Get([string]$url) {
  $resp = $client.GetAsync($url).Result
  $body = $resp.Content.ReadAsStringAsync().Result
  if ($resp.IsSuccessStatusCode) {
    Write-Output ("GET $url => $([int]$resp.StatusCode)")
  } else {
    Write-Output ("GET $url => ERROR $([int]$resp.StatusCode)")
    if ($body) { Write-Output ("RESPONSE_BODY=" + $body) }
  }
}

Test-Get 'http://localhost:4000/api/students'
Test-Get 'http://localhost:4000/api/teachers'
Test-Get 'http://localhost:4000/api/classes'
Test-Get 'http://localhost:4000/api/subjects'

try {
  $subject = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/subjects -Headers $headers -ContentType 'application/json' -Body ( @{ code=('SUB' + $ts); name=('Subject ' + $ts); description='Smoke test' } | ConvertTo-Json )
  Write-Output ('CREATED_SUBJECT_ID=' + $subject.id)
  $updated = Invoke-RestMethod -Method Put -Uri ('http://localhost:4000/api/subjects/' + $subject.id) -Headers $headers -ContentType 'application/json' -Body ( @{ code=$subject.code; name=($subject.name + ' Updated'); description=$subject.description } | ConvertTo-Json )
  Write-Output ('UPDATED_SUBJECT_ID=' + $updated.id)
  Invoke-RestMethod -Method Delete -Uri ('http://localhost:4000/api/subjects/' + $subject.id) -Headers $headers | Out-Null
  Write-Output ('DELETED_SUBJECT_ID=' + $subject.id)
} catch {
  Write-Output ("SUBJECT_CRUD_ERROR: $($_.Exception.Message)")
}

try {
  $class = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/classes -Headers $headers -ContentType 'application/json' -Body ( @{ name=('10A-' + $ts); level='10'; schoolId=$schoolId } | ConvertTo-Json )
  Write-Output ('CREATED_CLASS_ID=' + $class.id)
  Invoke-RestMethod -Method Delete -Uri ('http://localhost:4000/api/classes/' + $class.id) -Headers $headers | Out-Null
  Write-Output ('DELETED_CLASS_ID=' + $class.id)
} catch {
  Write-Output ("CLASS_CRUD_ERROR: $($_.Exception.Message)")
}

try {
  $teacherUser = 'teacher_test_' + $ts
  $teacherEmail = $teacherUser + '@sios.local'
  $teacherRegister = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/register -ContentType 'application/json' -Body ( @{ username=$teacherUser; email=$teacherEmail; password=$testPassword; role='TEACHER' } | ConvertTo-Json )
  $teacherUserId = $teacherRegister.id
  $teacher = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/teachers -Headers $headers -ContentType 'application/json' -Body ( @{ nip=('NIP' + $ts); name=('Guru ' + $ts); email=$teacherEmail; phone='081234567890'; schoolId=$schoolId; userId=$teacherUserId } | ConvertTo-Json )
  Write-Output ('CREATED_TEACHER_ID=' + $teacher.id)
  $teacherUpdated = Invoke-RestMethod -Method Put -Uri ('http://localhost:4000/api/teachers/' + $teacher.id) -Headers $headers -ContentType 'application/json' -Body ( @{ nip=$teacher.nip; name=($teacher.name + ' Updated'); email=$teacher.email; phone=$teacher.phone } | ConvertTo-Json )
  Write-Output ('UPDATED_TEACHER_ID=' + $teacherUpdated.id)
  Invoke-RestMethod -Method Delete -Uri ('http://localhost:4000/api/teachers/' + $teacher.id) -Headers $headers | Out-Null
  Write-Output ('DELETED_TEACHER_ID=' + $teacher.id)
} catch {
  Write-Output ("TEACHER_CRUD_ERROR: $($_.Exception.Message)")
}

try {
  $class = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/classes -Headers $headers -ContentType 'application/json' -Body ( @{ name=('10B-' + $ts); level='10'; schoolId=$schoolId } | ConvertTo-Json )
  Write-Output ('CREATED_CLASS_FOR_STUDENT_ID=' + $class.id)
  $studentUser = 'student_test_' + $ts
  $studentEmail = $studentUser + '@sios.local'
  $studentRegister = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/register -ContentType 'application/json' -Body ( @{ username=$studentUser; email=$studentEmail; password=$testPassword; role='STUDENT' } | ConvertTo-Json )
  $studentUserId = $studentRegister.id
  $student = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/students -Headers $headers -ContentType 'application/json' -Body ( @{ nis=('NIS' + $ts); nisn=('NISN' + $ts); name=('Siswa ' + $ts); email=$studentEmail; phone='081234567890'; gender='MALE'; address='Alamat Test'; classId=$class.id; schoolId=$schoolId; userId=$studentUserId } | ConvertTo-Json )
  Write-Output ('CREATED_STUDENT_ID=' + $student.id)
  $studentUpdated = Invoke-RestMethod -Method Put -Uri ('http://localhost:4000/api/students/' + $student.id) -Headers $headers -ContentType 'application/json' -Body ( @{ nis=$student.nis; nisn=$student.nisn; name=($student.name + ' Updated'); email=$student.email; phone=$student.phone; gender=$student.gender; address=$student.address; classId=$class.id } | ConvertTo-Json )
  Write-Output ('UPDATED_STUDENT_ID=' + $studentUpdated.id)
  Invoke-RestMethod -Method Delete -Uri ('http://localhost:4000/api/students/' + $student.id) -Headers $headers | Out-Null
  Write-Output ('DELETED_STUDENT_ID=' + $student.id)
  Invoke-RestMethod -Method Delete -Uri ('http://localhost:4000/api/classes/' + $class.id) -Headers $headers | Out-Null
  Write-Output ('DELETED_CLASS_FOR_STUDENT_ID=' + $class.id)
} catch {
  Write-Output ("STUDENT_CRUD_ERROR: $($_.Exception.Message)")
}
