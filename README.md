# 아주대학교 차세대 도서관 관리 시스템

MySQL 기반의 현대적인 도서관 관리 시스템입니다.

## 🎯 프로젝트 개요

아주대학교 도서관을 위한 통합 관리 시스템으로, 도서 대출/반납, 예약, 리뷰, 독서 목표 설정 등의 기능을 제공합니다.

## 🛠 기술 스택

### Backend
- **Node.js** + **Express.js**
- **MySQL** 8.0+
- **REST API**

### Database
- MySQL 8.0
- 7개 핵심 테이블
- 트리거 및 뷰 활용

## 📊 데이터베이스 구조

### 핵심 테이블
- **Members** - 회원 정보
- **Books** - 도서 정보
- **Loans** - 대출 기록
- **Reservations** - 예약 정보
- **Reviews** - 도서 리뷰
- **ReadingGoals** - 독서 목표
- **ReadingHistory** - 독서 이력

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/DataBase-Project-2025-2/library-management-system.git
cd library-management-system
```

### 2. 데이터베이스 설정
```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source database/schema.sql
source database/simple_test_data.sql
```

### 3. 백엔드 설정
```bash
cd backend
npm install

# .env 파일이 이미 생성되어 있습니다
# 필요시 데이터베이스 비밀번호 수정
```

### 4. 서버 실행
```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📡 API 엔드포인트

### 회원 관리
- `GET /api/members` - 전체 회원 조회
- `GET /api/members/:id` - 특정 회원 조회

### 도서 관리
- `GET /api/books` - 전체 도서 조회
- `GET /api/books/:id` - 특정 도서 조회
- `GET /api/books/search/:keyword` - 도서 검색

### 대출 관리
- `GET /api/loans` - 전체 대출 내역
- `GET /api/loans/active` - 대출 중인 도서
- `GET /api/loans/overdue` - 연체 도서
- `GET /api/loans/member/:memberId` - 특정 회원 대출 내역
- `POST /api/loans/borrow` - 도서 대출
- `POST /api/loans/return/:loanId` - 도서 반납
- `POST /api/loans/renew/:loanId` - 대출 연장

### 예약 관리
- `GET /api/reservations` - 전체 예약 조회
- `GET /api/reservations/active` - 활성 예약 조회
- `GET /api/reservations/member/:memberId` - 특정 회원 예약
- `POST /api/reservations/create` - 도서 예약
- `DELETE /api/reservations/:reservationId` - 예약 취소
- `POST /api/reservations/notify/:reservationId` - 예약 알림 발송
- `POST /api/reservations/fulfill/:reservationId` - 예약 이행 (자동 대출)

## 📁 프로젝트 구조

```
library-management-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── members.js
│   │   ├── books.js
│   │   ├── loans.js
│   │   └── reservations.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── database/
│   ├── schema.sql
│   └── simple_test_data.sql
└── README.md
```

## 🔐 환경 변수 설정

`.env` 파일 예시:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ajou_library
DB_PORT=3306
PORT=3000
JWT_SECRET=ajou_library_secret_key_2024
CORS_ORIGIN=http://localhost:3001
```

## ✨ 주요 기능

### 대출/반납 시스템
- ✅ 도서 대출/반납 자동화
- ✅ 대출 연장 (최대 2회, 14일씩)
- ✅ 연체료 자동 계산 (일당 500원)
- ✅ 재고 자동 관리
- ✅ 최대 대출 권수 제한 (5권)

### 예약 시스템
- ✅ 재고 없을 때만 예약 가능
- ✅ 최대 예약 권수 제한 (3권)
- ✅ 예약 유효기간 7일
- ✅ 중복 예약 방지
- ✅ 예약 알림 시스템
- ✅ 예약 이행 시 자동 대출

### 기타 기능
- ✅ RESTful API 구조
- ✅ 도서 검색 (제목, 저자, 키워드)
- ✅ 회원별 대출 내역 조회
- ✅ 연체 도서 관리

## 🧪 테스트 데이터

- 회원: 10명
- 도서: 20권
- 대출 기록: 15건
- 예약: 3건
- 리뷰: 3건
- 독서 목표: 2건
- 독서 이력: 2건

**총 55개 튜플**

## 📝 라이선스

MIT License

## 👥 개발팀

DataBase-Project-2025-2

## 📧 문의

프로젝트 관련 문의: GitHub Issues
