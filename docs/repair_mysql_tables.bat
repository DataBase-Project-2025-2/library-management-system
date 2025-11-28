@echo off
echo ===================================
echo MySQL 손상된 테이블 복구
echo ===================================
echo.

cd C:\xampp\mysql\bin

echo Step 1: MySQL 프로세스 종료...
taskkill /F /IM mysqld.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: 손상된 테이블 복구 중...
.\myisamchk.exe -r -f ..\data\mysql\proxies_priv.MYI
.\myisamchk.exe -r -f ..\data\mysql\user.MYI
.\myisamchk.exe -r -f ..\data\mysql\db.MYI
.\myisamchk.exe -r -f ..\data\mysql\tables_priv.MYI
.\myisamchk.exe -r -f ..\data\mysql\columns_priv.MYI

echo.
echo Step 3: 모든 mysql 시스템 테이블 검사...
for %%f in (..\data\mysql\*.MYI) do (
    echo 검사 중: %%f
    .\myisamchk.exe -r -f %%f
)

echo.
echo ===================================
echo 복구 완료!
echo 이제 XAMPP에서 MySQL을 시작하세요.
echo ===================================
pause
