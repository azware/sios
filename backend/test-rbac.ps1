# SIOS RBAC Quick Test
$BaseUrl = "http://localhost:4000/api"

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

Write-Host "
=== SIOS RBAC Quick Test ===" -ForegroundColor Cyan

Write-Host "[1] Check unauthenticated access to /students (expect 401)" -ForegroundColor Yellow
$r = Invoke-Api -Method GET -Endpoint "/students"
if ($r.ok) { Write-Host "FAILED: expected unauthorized but got ok" -ForegroundColor Red } else { Write-Host "Status: $($r.status)" -ForegroundColor Green }

Write-Host "`n[2] Register + Login admin" -ForegroundColor Yellow
$rand = Get-Random
$reg = Invoke-Api -Method POST -Endpoint "/auth/register" -Body @{ username = "rbac_admin_$rand"; email = "rbac_$rand@sios.local"; password = "admin123"; role = "ADMIN" }
if (-not $reg.ok) { Write-Host "Register failed: $($reg.error)" -ForegroundColor Red; exit 1 }
$login = Invoke-Api -Method POST -Endpoint "/auth/login" -Body @{ username = $reg.body.username; password = "admin123" }
if (-not $login.ok) { Write-Host "Login failed: $($login.error)" -ForegroundColor Red; exit 1 }
$token = $login.body.token
Write-Host "Logged in, token length: $($token.Length)" -ForegroundColor Green

Write-Host "`n[3] Access /students with token (expect 200)" -ForegroundColor Yellow
$r2 = Invoke-Api -Method GET -Endpoint "/students" -Token $token
if ($r2.ok) { Write-Host "OK (200)" -ForegroundColor Green } else { Write-Host "FAILED: status $($r2.status)" -ForegroundColor Red }

Write-Host "\nDone"
