# XAMPP MySQL 사용 가이드

## MySQL 시작 확인

### 1. XAMPP Control Panel에서 확인
- MySQL 상태가 초록색 (Running)인지 확인
- Port: 3306 (기본 포트)

### 2. 명령 프롬프트로 접속
```cmd
# XAMPP MySQL 경로로 이동
cd C:\xampp\mysql\bin

# MySQL 접속 (XAMPP는 기본적으로 root 비밀번호가 없음)
mysql -u root

# 또는 비밀번호가 설정되어 있다면
mysql -u root -p
```

### 3. phpMyAdmin으로 확인 (GUI)
- 브라우저에서 접속: http://localhost/phpmyadmin
- 왼쪽에 데이터베이스 목록이 보이면 정상!

## 데이터베이스 생성 (프로젝트용)

### 방법 1: phpMyAdmin 사용 (쉬움)
1. http://localhost/phpmyadmin 접속
2. 왼쪽 "새로 만들기" 클릭
3. 데이터베이스 이름: `ajou_library`
4. 문자 집합: `utf8mb4_unicode_ci`
5. "만들기" 클릭

### 방법 2: SQL 직접 실행
1. phpMyAdmin 접속
2. 상단 "SQL" 탭 클릭
3. 다음 명령 실행:
```sql
CREATE DATABASE ajou_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 방법 3: 명령 프롬프트 (추천)
```cmd
# MySQL 접속
cd C:\xampp\mysql\bin
mysql -u root

# 데이터베이스 생성
CREATE DATABASE ajou_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 확인
SHOW DATABASES;

# 나가기
exit
```

## 스키마 적용

### SQL 파일 실행
```cmd
# MySQL 접속
cd C:\xampp\mysql\bin
mysql -u root

# 데이터베이스 선택
USE ajou_library;

# SQL 파일 실행 (절대 경로 사용)
source C:/Users/chaeh/Desktop/wargame/DataBase project/database/schema.sql

# 샘플 데이터 삽입
source C:/Users/chaeh/Desktop/wargame/DataBase project/database/sample_data.sql
```

### 또는 phpMyAdmin에서
1. ajou_library 데이터베이스 선택
2. "가져오기" 탭 클릭
3. schema.sql 파일 선택 → "실행"
4. sample_data.sql 파일 선택 → "실행"

## XAMPP MySQL 기본 설정

### 기본 계정 정보
- **사용자명**: root
- **비밀번호**: (없음 - 비어있음)
- **호스트**: localhost
- **포트**: 3306

### .env 파일 설정 (백엔드용)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ajou_library
DB_PORT=3306
```

## 주의사항

### 보안 강화 (선택사항)
XAMPP의 root 계정은 기본적으로 비밀번호가 없습니다.
실제 서비스에서는 비밀번호를 설정하세요:

```sql
# MySQL 접속 후
ALTER USER 'root'@'localhost' IDENTIFIED BY '새비밀번호';
FLUSH PRIVILEGES;
```

### 포트 충돌 해결
만약 3306 포트가 이미 사용 중이라면:
1. XAMPP Control Panel → MySQL Config → my.ini
2. port=3306을 다른 포트로 변경 (예: 3307)
3. MySQL 재시작

## 문제 해결

### MySQL이 시작되지 않을 때
- 다른 MySQL 서비스가 실행 중인지 확인
- Windows 서비스에서 "MySQL80" 중지
- XAMPP의 MySQL 재시작

### phpMyAdmin 접속 안될 때
- Apache도 함께 실행 중인지 확인
- http://localhost 접속 확인
