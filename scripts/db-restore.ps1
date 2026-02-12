param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile,
  [string]$DbContainer = "sios-db-1",
  [string]$DbName = "schooldb",
  [string]$DbUser = "schooluser"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DumpFile)) {
  throw ("Dump file not found: {0}" -f $DumpFile)
}

$resolvedDump = (Resolve-Path $DumpFile).Path
Write-Output ("Restoring from: {0}" -f $resolvedDump)

Get-Content $resolvedDump | docker exec -i $DbContainer psql -U $DbUser -d $DbName

if ($LASTEXITCODE -ne 0) {
  throw "Restore failed. Check container/db credentials and SQL dump."
}

Write-Output "Restore completed."
