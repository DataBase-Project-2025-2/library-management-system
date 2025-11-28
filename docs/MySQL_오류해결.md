# MySQL 시작 오류 해결 가이드

## 오류: MySQL shutdown unexpectedly

### 원인 1: 포트 충돌 (가장 흔함)
다른 MySQL이나 MariaDB가 3306 포트를 사용 중

#### 해결 방법
1. **다른 MySQL 서비스 중지**
   - Windows 키 + R → `services.msc` 입력
   - "MySQL", "MySQL80", "MariaDB" 찾기
   - 우클릭 → "중지"
   - 시작 유형을 "수동"으로 변경

2. **포트 확인**
   ```cmd
   netstat -ano | findstr :3306
   ```
   - 결과가 나오면 해당 PID 프로세스 종료:
   ```cmd
   taskkill /F /PID [PID번호]
   ```

### 원인 2: ibdata 파일 손상

#### 해결 방법 (데이터 백업 필요!)
1. XAMPP Control Panel에서 MySQL 완전 중지
2. `C:\xampp\mysql\data` 폴더 백업
3. 다음 파일들 삭제:
   - ibdata1
   - ib_logfile0
   - ib_logfile1
4. MySQL 재시작

### 원인 3: my.ini 설정 문제

#### 해결 방법
1. XAMPP Control Panel → MySQL Config → my.ini
2. 다음 설정 확인/수정:

```ini
[mysqld]
port=3306
socket="C:/xampp/mysql/mysql.sock"
basedir="C:/xampp/mysql"
datadir="C:/xampp/mysql/data"
tmpdir="C:/xampp/tmp"

# 메모리 설정 (RAM이 적으면 줄이기)
key_buffer_size=16M
max_allowed_packet=16M
table_open_cache=64
sort_buffer_size=512K
net_buffer_length=8K
read_buffer_size=256K
read_rnd_buffer_size=512K
myisam_sort_buffer_size=8M

# InnoDB 설정
innodb_data_file_path=ibdata1:10M:autoextend
innodb_buffer_pool_size=16M
innodb_log_file_size=5M
innodb_log_buffer_size=8M
innodb_flush_log_at_trx_commit=1
innodb_lock_wait_timeout=50
```

3. 저장 후 MySQL 재시작

### 원인 4: 권한 문제

#### 해결 방법
1. XAMPP를 관리자 권한으로 실행
   - xampp-control.exe 우클릭
   - "관리자 권한으로 실행"
2. MySQL Start 시도

### 원인 5: 이전 MySQL 프로세스가 남아있음

#### 해결 방법
```cmd
# 작업 관리자 열기 (Ctrl + Shift + Esc)
# "세부 정보" 탭에서 mysqld.exe 찾아서 종료

# 또는 명령 프롬프트에서
taskkill /F /IM mysqld.exe
```

## 📋 단계별 해결 순서

### Step 1: 포트 확인
```cmd
netstat -ano | findstr :3306
```

### Step 2: 다른 MySQL 서비스 중지
1. Windows + R → `services.msc`
2. MySQL 관련 서비스 모두 중지

### Step 3: XAMPP 관리자 권한으로 재시작
1. XAMPP 완전 종료
2. 우클릭 → 관리자 권한으로 실행
3. MySQL Start

### Step 4: 로그 확인
XAMPP Control Panel → MySQL Logs 버튼 클릭
마지막 에러 메시지 확인

### Step 5: 여전히 안되면 재설치
1. XAMPP Control Panel에서 MySQL 제거
2. `C:\xampp\mysql\data` 백업
3. XAMPP 재설치 또는 MySQL만 다시 설치

## 🆘 로그 확인 방법

### MySQL 에러 로그 위치
```
C:\xampp\mysql\data\mysql_error.log
```

이 파일을 열어서 마지막 에러 메시지를 확인하세요.

### 자주 나오는 에러와 해결

#### "[ERROR] Can't start server: Bind on TCP/IP port: Address already in use"
→ 3306 포트가 사용 중. 다른 MySQL 중지 필요

#### "[ERROR] InnoDB: Cannot open datafile './ibdata1'"
→ ibdata1 파일 손상. 백업 후 삭제하고 재시작

#### "[ERROR] Found option without preceding group in config file"
→ my.ini 파일 문법 오류. 설정 확인 필요

## 💡 임시 해결책: 포트 변경

다른 MySQL을 중지할 수 없다면 XAMPP MySQL 포트를 변경:

1. `C:\xampp\mysql\bin\my.ini` 수정
```ini
[mysqld]
port=3307  # 3306 → 3307로 변경
```

2. `C:\xampp\phpMyAdmin\config.inc.php` 수정
```php
$cfg['Servers'][$i]['port'] = '3307';  // 추가
```

3. 백엔드 .env 파일도 수정
```env
DB_PORT=3307
```

## 📞 그래도 안되면?

로그 파일 내용을 공유해주세요:
- C:\xampp\mysql\data\mysql_error.log
- XAMPP Control Panel의 Logs 내용

구체적인 에러 메시지를 보면 정확한 해결책을 드릴 수 있습니다!
