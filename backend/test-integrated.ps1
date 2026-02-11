$BaseUrl = "http://localhost:4000/api"
$PassCount = 0
$FailCount = 0

function Invoke-Api {
    param([string]$Method, [string]$Endpoint, [string]$Token=$null, [object]$Body=$null)
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        if ($Body) {
            $resp = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers -ContentType 'application/json' -Body ($Body | ConvertTo-Json)
        } else {
            $resp = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers
        }
        return @{ ok = $true; status = 200; body = $resp }
    } catch {
        $status = $_.Exception.Response.StatusCode.Value__ 2>$null
        return @{ ok = $false; status = $status; error = $_.Exception.Message }
    }
}

function Test-Case {
    param([string]$Name, [scriptblock]$TestBlock)
    Write-Host "  $Name..." -NoNewline -ForegroundColor Gray
    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host " PASS" -ForegroundColor Green
            $global:PassCount++
        } else {
            Write-Host " FAIL" -ForegroundColor Red
            $global:FailCount++
        }
    } catch {
        Write-Host " ERROR" -ForegroundColor Red
        $global:FailCount++
    }
}

Write-Host ""
Write-Host "SIOS API Integrated Test Suite" -ForegroundColor Cyan
Write-Host ""

$rand = Get-Random
$adminUsername = "admin_test_$rand"
$adminEmail = "admin_test_$rand@sios.local"
$teacherUsername = "teacher_test_$rand"
$teacherEmail = "teacher_test_$rand@sios.local"
$studentUsername = "student_test_$rand"
$studentEmail = "student_test_$rand@sios.local"

$adminToken = $null
$teacherToken = $null
$studentToken = $null

Write-Host "[1] Authentication - Registration" -ForegroundColor Yellow

Test-Case "Register admin user" {
    $reg = Invoke-Api -Method POST -Endpoint "/auth/register" -Body @{
        username = $adminUsername
        email = $adminEmail
        password = "admin123"
        role = "ADMIN"
    }
    if ($reg.ok -and $reg.body.role -eq "ADMIN") {
        return $true
    }
    return $false
}

Test-Case "Register teacher user" {
    $reg = Invoke-Api -Method POST -Endpoint "/auth/register" -Body @{
        username = $teacherUsername
        email = $teacherEmail
        password = "teacher123"
        role = "TEACHER"
    }
    if ($reg.ok -and $reg.body.role -eq "TEACHER") {
        return $true
    }
    return $false
}

Test-Case "Register student user" {
    $reg = Invoke-Api -Method POST -Endpoint "/auth/register" -Body @{
        username = $studentUsername
        email = $studentEmail
        password = "student123"
        role = "STUDENT"
    }
    if ($reg.ok -and $reg.body.role -eq "STUDENT") {
        return $true
    }
    return $false
}

Test-Case "Admin login returns token" {
    $login = Invoke-Api -Method POST -Endpoint "/auth/login" -Body @{
        username = $adminUsername
        password = "admin123"
    }
    if ($login.ok -and $login.body.token) {
        $global:adminToken = $login.body.token
        return $true
    }
    return $false
}

Test-Case "Teacher login returns token" {
    $login = Invoke-Api -Method POST -Endpoint "/auth/login" -Body @{
        username = $teacherUsername
        password = "teacher123"
    }
    if ($login.ok -and $login.body.token) {
        $global:teacherToken = $login.body.token
        return $true
    }
    return $false
}

Test-Case "Student login returns token" {
    $login = Invoke-Api -Method POST -Endpoint "/auth/login" -Body @{
        username = $studentUsername
        password = "student123"
    }
    if ($login.ok -and $login.body.token) {
        $global:studentToken = $login.body.token
        return $true
    }
    return $false
}

Write-Host ""
Write-Host "[2] Protected Endpoints - No Authentication" -ForegroundColor Yellow

Test-Case "GET /students without token returns 401" {
    $r = Invoke-Api -Method GET -Endpoint "/students"
    return !$r.ok -and $r.status -eq 401
}

Test-Case "GET /teachers without token returns 401" {
    $r = Invoke-Api -Method GET -Endpoint "/teachers"
    return !$r.ok -and $r.status -eq 401
}

Test-Case "GET /grades without token returns 401" {
    $r = Invoke-Api -Method GET -Endpoint "/grades"
    return !$r.ok -and $r.status -eq 401
}

Write-Host ""
Write-Host "[3] Admin Authorization - Full Access" -ForegroundColor Yellow

Test-Case "Admin GET /students returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/students" -Token $adminToken
    return $r.ok -and $r.status -eq 200
}

Test-Case "Admin GET /teachers returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/teachers" -Token $adminToken
    return $r.ok -and $r.status -eq 200
}

Test-Case "Admin GET /grades returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/grades" -Token $adminToken
    return $r.ok -and $r.status -eq 200
}

Test-Case "Admin GET /payments returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/payments" -Token $adminToken
    return $r.ok -and $r.status -eq 200
}

Write-Host ""
Write-Host "[4] Teacher Authorization" -ForegroundColor Yellow

Test-Case "Teacher GET /students returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/students" -Token $teacherToken
    return $r.ok -and $r.status -eq 200
}

Test-Case "Teacher GET /teachers returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/teachers" -Token $teacherToken
    return $r.ok -and $r.status -eq 200
}

Test-Case "Teacher GET /grades returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/grades" -Token $teacherToken
    return $r.ok -and $r.status -eq 200
}

Write-Host ""
Write-Host "[5] Student Authorization" -ForegroundColor Yellow

Test-Case "Student GET /students returns 403 (forbidden)" {
    $r = Invoke-Api -Method GET -Endpoint "/students" -Token $studentToken
    return !$r.ok -and $r.status -eq 403
}

Test-Case "Student GET /teachers returns 403 (forbidden)" {
    $r = Invoke-Api -Method GET -Endpoint "/teachers" -Token $studentToken
    return !$r.ok -and $r.status -eq 403
}

Test-Case "Student GET /grades returns 403 (forbidden)" {
    $r = Invoke-Api -Method GET -Endpoint "/grades" -Token $studentToken
    return !$r.ok -and $r.status -eq 403
}

Write-Host ""
Write-Host "[6] Health Check" -ForegroundColor Yellow

Test-Case "GET /health returns 200" {
    $r = Invoke-Api -Method GET -Endpoint "/health"
    return $r.ok -and $r.status -eq 200
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$totalTests = $PassCount + $FailCount
Write-Host "Total: $totalTests"
Write-Host "Passed: $PassCount" -ForegroundColor Green
Write-Host "Failed: $FailCount" -ForegroundColor $(if ($FailCount -eq 0) { "Green" } else { "Red" })

if ($FailCount -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed" -ForegroundColor Red
    exit 1
}
