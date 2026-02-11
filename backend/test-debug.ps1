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

Write-Host "Debug: Testing student endpoints"

$rand = Get-Random
$studentUsername = "student_debug_$rand"
$studentEmail = "student_debug_$rand@sios.local"

$reg = Invoke-Api -Method POST -Endpoint "/auth/register" -Body @{
    username = $studentUsername
    email = $studentEmail
    password = "student123"
    role = "STUDENT"
}

if ($reg.ok) {
    $login = Invoke-Api -Method POST -Endpoint "/auth/login" -Body @{
        username = $studentUsername
        password = "student123"
    }
    
    if ($login.ok) {
        $studentToken = $login.body.token
        Write-Host "Student token: $($studentToken.Substring(0,20))..."
        
        Write-Host ""
        Write-Host "Testing /students endpoint..."
        $r1 = Invoke-Api -Method GET -Endpoint "/students" -Token $studentToken
        Write-Host "Result: ok=$($r1.ok), status=$($r1.status)"
        
        Write-Host ""
        Write-Host "Testing /teachers endpoint..."
        $r2 = Invoke-Api -Method GET -Endpoint "/teachers" -Token $studentToken
        Write-Host "Result: ok=$($r2.ok), status=$($r2.status)"
        
        Write-Host ""
        Write-Host "Testing /grades endpoint..."
        $r3 = Invoke-Api -Method GET -Endpoint "/grades" -Token $studentToken
        Write-Host "Result: ok=$($r3.ok), status=$($r3.status)"
    }
}
