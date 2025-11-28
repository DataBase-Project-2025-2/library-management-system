# MySQL 설치 가이드

## Windows용 MySQL 설치

### 1. MySQL Installer 다운로드
1. 공식 사이트 접속: https://dev.mysql.com/downloads/installer/
2. "mysql-installer-community-8.x.x.msi" 다운로드 (약 300MB)
3. "No thanks, just start my download" 클릭

### 2. 설치 시작
1. 다운로드한 mysql-installer-community.msi 실행
2. "Developer Default" 선택 (추천)
   - MySQL Server
   - MySQL Workbench (GUI 도구)
   - MySQL Shell
   - Connector/J (Java용)

### 3. 설치 과정
#### Check Requirements
- 필요한 Visual C++ 재배포 패키지 자동 설치
- "Execute" 클릭

#### Installation
- 선택한 제품들이 설치됨
- "Execute" 클릭하여 시작

### 4. MySQL Server 설정

#### Type and Networking
- Config Type: Development Computer (개발용)
- Port: 3306 (기본값 유지)
- X Protocol Port: 33060 (기본값 유지)

#### Authentication Method
- "Use Strong Password Encryption" 선택 (추천)

#### Accounts and Roles
- **Root Password 설정**: 
  - 강력한 비밀번호 입력 (예: Ajou2024!@#)
  - 비밀번호를 꼭 기억하세요!
- MySQL User Accounts 추가 (선택사항):
  - Username: ajou_user
  - Role: DB Admin
  - Password: 원하는 비밀번호

#### Windows Service
- Service Name: MySQL80 (기본값)
- Start the MySQL Server at System Startup (체크)
- Run Windows Service as: Standard System Account

#### Apply Configuration
- "Execute" 클릭하여 설정 적용

### 5. MySQL Workbench 설정
- Root password로 연결 테스트
- 성공하면 설치 완료!

## 설치 확인

### 명령 프롬프트에서 확인
```cmd
# MySQL 버전 확인
mysql --version

# MySQL 접속 테스트
mysql -u root -p
# (비밀번호 입력)
```

성공하면 다음과 같이 표시됩니다:
```
Welcome to the MySQL monitor...
mysql>
```

### 환경 변수 설정 (필요시)
MySQL이 명령어로 인식 안되면:
1. 시스템 환경 변수 편집
2. Path에 추가: C:\Program Files\MySQL\MySQL Server 8.0\bin

## 문제 해결

### "Access denied for user 'root'@'localhost'" 오류
- 비밀번호를 잘못 입력한 경우
- MySQL Installer에서 "Reconfigure" 선택하여 비밀번호 재설정

### 3306 포트가 이미 사용 중
- 다른 MySQL이나 MariaDB가 설치되어 있는지 확인
- 기존 서비스 중지 또는 다른 포트 사용

### 서비스가 시작되지 않음
- Windows 서비스에서 MySQL80 서비스 상태 확인
- 수동으로 시작 시도

## 다음 단계
설치가 완료되면:
1. MySQL Workbench 열기
2. Local instance (root) 연결
3. 데이터베이스 생성 준비 완료!
