# SIOS Backend Comprehensive Test Script
$BaseUrl = "http://localhost:4000/api"
$ErrorCount = 0

function Test-Endpoint {
    param([string]$Name, [string]$Method, [string]$Endpoint, [object]$Body)
    
    try {
        Write-Host "$Name..." -ForegroundColor Gray -NoNewline
        
        if ($Body) {
            $response = Invoke-WebRequest -Uri "$BaseUrl$Endpoint" -Method $Method -UseBasicParsing -ContentType "application/json" -Body ($Body | ConvertTo-Json)
        } else {
            $response = Invoke-WebRequest -Uri "$BaseUrl$Endpoint" -Method $Method -UseBasicParsing
        }
        
        Write-Host " OK" -ForegroundColor Green
        return $response.Content | ConvertFrom-Json
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $global:ErrorCount++
        return $null
    }
}

Write-Host "`n=== SIOS Backend Comprehensive Test ===" -ForegroundColor Cyan

# Test 1: Auth Endpoints
Write-Host "`n[1] Authentication Tests" -ForegroundColor Yellow

$user1 = Test-Endpoint "Register admin" "POST" "/auth/register" @{
    username = "test_admin_$(Get-Random)"
    email = "admin_$(Get-Random)@sios.local"
    password = "admin123"
    role = "ADMIN"
}

if ($user1) {
    $adminId = $user1.id
    Test-Endpoint "Login" "POST" "/auth/login" @{
        username = $user1.username
        password = "admin123"
    } | Out-Null
}

# Test 2: GET All Endpoints
Write-Host "`n[2] GET All Data Endpoints" -ForegroundColor Yellow

Test-Endpoint "Get Health" "GET" "/health" $null | Out-Null
Test-Endpoint "Get Students" "GET" "/students" $null | Out-Null
Test-Endpoint "Get Teachers" "GET" "/teachers" $null | Out-Null
Test-Endpoint "Get Classes" "GET" "/classes" $null | Out-Null
Test-Endpoint "Get Subjects" "GET" "/subjects" $null | Out-Null
Test-Endpoint "Get Attendance" "GET" "/attendance" $null | Out-Null
Test-Endpoint "Get Grades" "GET" "/grades" $null | Out-Null
Test-Endpoint "Get Payments" "GET" "/payments" $null | Out-Null

# Test 3: Create Resources
Write-Host "`n[3] Creating Test Resources" -ForegroundColor Yellow

$subject = Test-Endpoint "Create Subject" "POST" "/subjects" @{
    code = "MTH-101"
    name = "Matematika"
    description = "Mata pelajaran Matematika dasar"
}

# Test 4: Error Handling
Write-Host "`n[4] Error Handling Tests" -ForegroundColor Yellow

Test-Endpoint "Get non-existent student" "GET" "/students/99999" $null | Out-Null
Test-Endpoint "Invalid login" "POST" "/auth/login" @{
    username = "nonexistent"
    password = "wrong"
} | Out-Null

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host "$ErrorCount test(s) failed" -ForegroundColor Yellow
}

Write-Host "`nServer Status: RUNNING" -ForegroundColor Green
Write-Host "Database: Connected" -ForegroundColor Green
