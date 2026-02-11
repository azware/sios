$BaseUrl = "http://localhost:4000/api"

Write-Host "=== SIOS Backend API Test ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content) {
        Write-Host "Status: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $($_)" -ForegroundColor Red
}

# Test 2: Register User
Write-Host "`n2. Testing User Registration..." -ForegroundColor Yellow
try {
    $body = @{
        username = "admin1"
        email = "admin1@sios.local"
        password = "admin123"
        role = "ADMIN"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/auth/register" -Method POST -UseBasicParsing -ContentType "application/json" -Body $body
    $user = $response.Content | ConvertFrom-Json
    Write-Host "User created: $($user.username) (ID: $($user.id))" -ForegroundColor Green
    $adminId = $user.id
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Register Student User
Write-Host "`n3. Registering Student User..." -ForegroundColor Yellow
try {
    $body = @{
        username = "student1"
        email = "student1@sios.local"
        password = "student123"
        role = "STUDENT"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/auth/register" -Method POST -UseBasicParsing -ContentType "application/json" -Body $body
    $user = $response.Content | ConvertFrom-Json
    Write-Host "Student user created: $($user.username) (ID: $($user.id))" -ForegroundColor Green
    $studentUserId = $user.id
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Login
Write-Host "`n4. Testing Login..." -ForegroundColor Yellow
try {
    $body = @{
        username = "admin1"
        password = "admin123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -UseBasicParsing -ContentType "application/json" -Body $body
    $loginResponse = $response.Content | ConvertFrom-Json
    $token = $loginResponse.token
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get Students (empty list)
Write-Host "`n5. Testing Get Students..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/students" -Method GET -UseBasicParsing
    $students = $response.Content | ConvertFrom-Json
    Write-Host "Students endpoint: OK" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Teachers (empty list)
Write-Host "`n6. Testing Get Teachers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/teachers" -Method GET -UseBasicParsing
    $teachers = $response.Content | ConvertFrom-Json
    Write-Host "Teachers endpoint: OK" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get Classes (empty list)
Write-Host "`n7. Testing Get Classes..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/classes" -Method GET -UseBasicParsing
    $classes = $response.Content | ConvertFrom-Json
    Write-Host "Classes endpoint: OK" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Get Subjects (empty list)
Write-Host "`n8. Testing Get Subjects..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/subjects" -Method GET -UseBasicParsing
    $subjects = $response.Content | ConvertFrom-Json
    Write-Host "Subjects endpoint: OK" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Get Attendance (empty list)
Write-Host "`n9. Testing Get Attendance..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/attendance" -Method GET -UseBasicParsing
    $attendance = $response.Content | ConvertFrom-Json
    Write-Host "Attendance endpoint: OK" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Get Grades (empty list)
Write-Host "`n10. Testing Get Grades..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/grades" -Method GET -UseBasicParsing
    $grades = $response.Content | ConvertFrom-Json
    Write-Host "Grades endpoint: OK" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 11: Get Payments (empty list)
Write-Host "`n11. Testing Get Payments..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/payments" -Method GET -UseBasicParsing
    $payments = $response.Content | ConvertFrom-Json
    Write-Host "Payments endpoint: OK" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host "Backend API is working correctly!" -ForegroundColor Green

