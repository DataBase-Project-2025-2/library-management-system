@echo off
echo ===================================
echo MySQL Aria Recovery Script
echo ===================================
echo.

cd C:\xampp\mysql\data

echo Step 1: MySQL 중지 확인...
tasklist | findstr mysqld
echo (mysqld가 보이면 XAMPP에서 MySQL을 Stop 하세요)
echo.
pause

echo Step 2: Aria 로그 파일 삭제...
del /F /Q aria_log_control
del /F /Q aria_log.*

echo.
echo Step 3: MySQL 시스템 데이터베이스 복구...
cd C:\xampp\mysql\bin

echo mysql 데이터베이스 복구 중...
.\aria_chk.exe -r ..\data\mysql\*.MAI

echo.
echo ===================================
echo 완료! 이제 XAMPP에서 MySQL을 시작하세요.
echo ===================================
pause
