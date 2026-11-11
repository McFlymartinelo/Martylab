# Crée l'archive du kit de marque Martylab.
# Structure propre via un dossier de staging, puis Compress-Archive.

$ErrorActionPreference = "Stop"
$brand = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$version = "1.0.0"
$name = "martylab-brand-kit-v$version"
$stage = Join-Path $env:TEMP "brandtools\stage\$name"
$zip = Join-Path $brand "dist\$name.zip"

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $brand "dist") -Force | Out-Null

Copy-Item (Join-Path $brand "assets") $stage -Recurse
Copy-Item (Join-Path $brand "martylab-brand-guide.pdf") $stage
Copy-Item (Join-Path $brand "martylab-brand-sheet.pdf") $stage
Copy-Item (Join-Path $brand "README.md") $stage
Copy-Item (Join-Path $brand "MANIFEST.md") $stage
Copy-Item (Join-Path $brand "INTEGRATION.md") $stage

$srcStage = Join-Path $stage "src"
New-Item -ItemType Directory -Path $srcStage | Out-Null
Get-ChildItem (Join-Path $brand "src") -File | Where-Object { $_.Extension -in ".mjs", ".py", ".ps1" } |
  Copy-Item -Destination $srcStage
$genStage = Join-Path $srcStage "generated"
New-Item -ItemType Directory -Path $genStage | Out-Null
Get-ChildItem (Join-Path $brand "src\generated") -File | Where-Object { $_.Extension -eq ".json" } |
  Copy-Item -Destination $genStage

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -CompressionLevel Optimal

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zip)
$count = $archive.Entries.Count
$archive.Dispose()

Write-Output "archive : $zip"
Write-Output "entrées : $count"
Write-Output ("taille : " + [math]::Round((Get-Item $zip).Length / 1KB, 1) + " Ko")
