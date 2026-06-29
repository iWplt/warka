# Run this script AFTER fully closing Cursor (and any terminal using A:\Website).
# It renames the old folder and creates a junction so A:\Website -> D:\Website.
# This preserves Cursor chat history tied to the A:\Website workspace path.

$ErrorActionPreference = "Stop"

$source = "A:\Website"
$backup = "A:\Website_backup_before_junction"
$target = "D:\Website"

if (-not (Test-Path $target)) {
    Write-Error "Target not found: $target"
}

if (Test-Path $backup) {
    Write-Error "Backup already exists: $backup. Remove or rename it first."
}

# If source is already a junction, we're done.
$item = Get-Item $source -Force -ErrorAction SilentlyContinue
if ($item -and $item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
    $junctionTarget = (Get-Item $source).Target
    Write-Host "Junction already exists: $source -> $junctionTarget"
    exit 0
}

if (-not (Test-Path $source)) {
    Write-Host "Source missing; creating junction only..."
    cmd /c mklink /J "$source" "$target"
    exit $LASTEXITCODE
}

Write-Host "Renaming $source -> $backup"
Rename-Item -Path $source -NewName (Split-Path $backup -Leaf)

Write-Host "Creating junction $source -> $target"
cmd /c mklink /J "$source" "$target"

if ($LASTEXITCODE -ne 0) {
    Write-Error "mklink failed. Restoring backup..."
    Rename-Item -Path $backup -NewName (Split-Path $source -Leaf)
    exit 1
}

Write-Host ""
Write-Host "Done. Open Cursor with: $source"
Write-Host "Files live on: $target"
Write-Host "You can delete the backup later: $backup"
