# 아주대학교 차세대 도서관 관리 시스템

MySQL 기반의 현대적인 도서관 관리 시스템입니다.

## 🎯 프로젝트 개요

아주대학교 도서관을 위한 통합 관리 시스템으로, 도서 대출/반납, 예약, 리뷰, 독서 목표 설정 등의 기능을 제공합니다.

## 🛠 기술 스택

### Backend
- **Node.js** + **Express.js**
- **MySQL** 8.0+
- **JWT** 인증

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
git clone https://github.com/your-username/ajou-library-system.git
cd ajou-library-system
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

# .env 파일 생성
cp .env.example .env
# .env 파일에서 데이터베이스 설정 수정
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
- `POST /api/loans/borrow` - 도서 대출
- `POST /api/loans/return/:loanId` - 도서 반납
- `POST /api/loans/renew/:loanId` - 대출 연장

## 📁 프로젝트 구조

```
ajou-library-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── members.js
│   │   ├── books.js
│   │   └── loans.js
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
DB_PASSWORD=your_password
DB_NAME=ajou_library
DB_PORT=3306
PORT=3000
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3001
```

## ✨ 주요 기능

- ✅ 도서 대출/반납 자동화
- ✅ 대출 연장 (최대 2회)
- ✅ 연체료 자동 계산 (일당 500원)
- ✅ 재고 자동 관리
- ✅ 최대 대출 권수 제한 (5권)
- ✅ RESTful API 구조

## 📝 라이선스

MIT License

## 👥 기여자

- [Your Name]

## 📧 문의

프로젝트 관련 문의: your-email@ajou.ac.kr
