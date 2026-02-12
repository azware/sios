param(
  [string]$OutDir = "backups",
  [string]$DbContainer = "sios-db-1",
  [string]$DbName = "schooldb",
  [string]$DbUser = "schooluser"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $OutDir ("{0}_{1}.sql" -f $DbName, $timestamp)

Write-Output ("Creating backup: {0}" -f $outFile)
docker exec $DbContainer pg_dump -U $DbUser -d $DbName > $outFile

if ($LASTEXITCODE -ne 0) {
  if (Test-Path $outFile) {
    Remove-Item $outFile -Force
  }
  throw "Backup failed. Check container/db credentials."
}

Write-Output ("Backup completed: {0}" -f (Resolve-Path $outFile))
