# CCBot Installation Script for Windows
# Usage: irm https://www.ccbot.dev/install.ps1 | iex

$ErrorActionPreference = 'Stop'

# Configuration
$Repo = "uikoo9/ccbot"
$BinaryName = "ccbot.exe"
$InstallDir = "$env:LOCALAPPDATA\Programs\ccbot"

Write-Host ""
Write-Host "╔═╗╔═╗╔╗ ╔═╗╔╦╗" -ForegroundColor Cyan
Write-Host "║  ║  ╠╩╗║ ║ ║ " -ForegroundColor Cyan
Write-Host "╚═╝╚═╝╚═╝╚═╝ ╩ " -ForegroundColor Cyan
Write-Host ""
Write-Host "CCBot Installer for Windows" -ForegroundColor Green
Write-Host ""

# Get latest version
Write-Host "Fetching latest version..." -ForegroundColor Yellow
$LatestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
$Version = $LatestRelease.tag_name

if (-not $Version) {
    Write-Host "Failed to fetch latest version" -ForegroundColor Red
    exit 1
}

Write-Host "Latest version: $Version" -ForegroundColor Green

# Download URL
$DownloadUrl = "https://github.com/$Repo/releases/download/$Version/ccbot-win-x64.exe"

Write-Host "Downloading from: $DownloadUrl" -ForegroundColor Yellow

# Create install directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$BinaryPath = Join-Path $InstallDir $BinaryName

# Download
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $BinaryPath
} catch {
    Write-Host "Failed to download ccbot" -ForegroundColor Red
    exit 1
}

# Add to PATH if not already there
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallDir*") {
    Write-Host "Adding to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$UserPath;$InstallDir",
        "User"
    )
    $env:Path = "$env:Path;$InstallDir"
}

Write-Host ""
Write-Host "✓ CCBot installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Run 'ccbot --version' to verify installation" -ForegroundColor Cyan
Write-Host "Run 'ccbot --help' to get started" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: You may need to restart your terminal for PATH changes to take effect" -ForegroundColor Yellow
