# MySQL 시스템 테이블 재생성 스크립트
# 관리자 권한 PowerShell에서 실행하세요

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "MySQL 시스템 테이블 재생성" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. MySQL 프로세스 종료
Write-Host "Step 1: MySQL 프로세스 종료 중..." -ForegroundColor Yellow
Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. 백업
Write-Host "Step 2: 기존 mysql 폴더 백업 중..." -ForegroundColor Yellow
$backupName = "mysql_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (Test-Path "C:\xampp\mysql\data\mysql") {
    Copy-Item -Recurse "C:\xampp\mysql\data\mysql" "C:\xampp\mysql\data\$backupName"
    Write-Host "백업 완료: $backupName" -ForegroundColor Green
}

# 3. 손상된 폴더 삭제
Write-Host "Step 3: 손상된 mysql 폴더 삭제 중..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "C:\xampp\mysql\data\mysql" -ErrorAction SilentlyContinue

# 4. MySQL 시스템 DB 재생성
Write-Host "Step 4: MySQL 시스템 데이터베이스 재생성 중..." -ForegroundColor Yellow
Set-Location "C:\xampp\mysql\bin"
& .\mysql_install_db.exe --datadir="C:\xampp\mysql\data"

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "재생성 완료!" -ForegroundColor Green
Write-Host "이제 XAMPP에서 MySQL을 시작하세요." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# 5. MySQL 시작 확인 (선택)
$response = Read-Host "지금 MySQL을 시작해볼까요? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host "MySQL 시작 중..." -ForegroundColor Yellow
    Start-Process -FilePath ".\mysqld.exe" -ArgumentList "--console"
}
