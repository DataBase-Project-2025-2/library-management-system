# 📚 아주대학교 차세대 도서관 관리 시스템

아주대학교 도서관을 모티브로 한 **풀스택 도서관 관리 시스템**입니다.

## 🎯 프로젝트 개요

- **과목**: 데이터베이스 프로젝트 (2024-2학기)
- **주제**: 도서관 관리 시스템 구축
- **기간**: 2024.11 ~ 2024.12
- **기술 스택**: React, Node.js, Express, MySQL, OpenAI API

---

## ✨ 주요 기능

### 👤 사용자 기능
- ✅ **로그인/로그아웃**: JWT 인증 시스템
- ✅ **개인화 홈**: 독서 통계, 선호 카테고리 차트, 개인 추천
- ✅ **도서 검색**: 제목/저자 검색, 카테고리 필터링
- ✅ **도서 상세**: 소장정보, 서평, 좋아요, 대출 통계 차트
- ✅ **대출/반납**: 대출 연장(최대 2회), 연체료 자동 계산
- ✅ **예약 시스템**: 대출 중 도서 예약, 예약 취소
- ✅ **서평 작성**: 별점 + 코멘트
- ✅ **독서 목표**: 연간 독서 목표 설정 및 달성률 추적
- ✅ **독서 필기**: 페이지별 필기, 중요 문장 표시
- ✅ **마이페이지**: 대출 현황/이력, 예약 관리, 서평 관리, 필기 관리
- ✅ **좌석 예약**: 실시간 좌석 현황, 좌석 예약/체크인/퇴실
- ✅ **AI 챗봇**: 도서 추천, 대출 방법 안내, FAQ 자동 응답

### ⚙️ 관리자 기능
- ✅ **통합 대시보드**: 실시간 통계 (도서, 회원, 대출, 연체)
- ✅ **도서 관리**: CRUD, 재고 조정, 검색
- ✅ **회원 관리**: 목록/상세, 정지/활성화, 연체자 관리
- ✅ **대출 관리**: 전체 현황, 강제 반납, 상태별 필터
- ✅ **예약 관리**: 예약 목록, 예약 취소
- ✅ **통계 리포트**: 차트, 인기 도서 TOP 10, 활발한 회원
- ✅ **관리자 로그**: 모든 관리 활동 기록

---

## 🗄️ 데이터베이스 구조

### 테이블 (7개)
- **Members** (61명): 회원 정보
- **Books** (100권): 도서 정보
- **Loans** (300+건): 대출 이력
- **Reservations** (50+건): 예약 정보
- **Reviews** (100+개): 서평
- **ReadingGoals**: 독서 목표
- **ReadingNotes**: 독서 필기
- **BookLikes**: 도서 좋아요
- **Seats** (48석): 좌석 정보
- **SeatReservations**: 좌석 예약
- **AdminLogs**: 관리자 활동 로그

---

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/DataBase-Project-2025-2/library-management-system.git
cd library-management-system
```

### 2. 데이터베이스 설정
```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE ajou_library;
USE ajou_library;

# 방법 1: 전체 백업 복원 (구조 + 데이터 441개)
source database/full_backup.sql

# 방법 2: 스키마만 먼저 생성
source database/schema.sql
source database/simple_test_data.sql
```

### 3. 백엔드 설정
```bash
cd backend
npm install

# .env 파일 생성
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=ajou_library
# DB_PORT=3306
# PORT=3000
# JWT_SECRET=ajou_library_secret_key_2024
# CORS_ORIGIN=http://localhost:3001
# OPENAI_API_KEY=your_openai_api_key

# 서버 실행
node server.js
```

### 4. 프론트엔드 설정
```bash
cd frontend
npm install
npm start
```

### 5. 접속
- **프론트엔드**: http://localhost:3001
- **백엔드 API**: http://localhost:3000

### 6. 테스트 계정
- **일반 사용자**: `202493433` / `1234`
- **관리자**: `admin` / `rhksflwk0810`

---

## 📂 프로젝트 구조

```
library-management-system/
├── backend/                    # Node.js + Express 백엔드
│   ├── routes/
│   │   ├── auth.js            # 인증 API
│   │   ├── books.js           # 도서 API
│   │   ├── loans.js           # 대출 API
│   │   ├── reservations.js    # 예약 API
│   │   ├── reviews.js         # 서평 API
│   │   ├── statistics.js      # 통계 API
│   │   ├── reading-goals.js   # 독서 목표 API
│   │   ├── reading-notes.js   # 독서 필기 API
│   │   ├── likes.js           # 좋아요 API
│   │   ├── seats.js           # 좌석 API
│   │   ├── chatbot.js         # AI 챗봇 API
│   │   ├── admin-books.js     # 관리자 도서 API
│   │   ├── admin-members.js   # 관리자 회원 API
│   │   └── admin-operations.js # 관리자 운영 API
│   ├── config/
│   │   └── database.js        # DB 연결
│   └── server.js              # 서버 진입점
├── frontend/                   # React 프론트엔드
│   └── src/
│       └── components/
│           ├── Login.js       # 로그인
│           ├── Home.js        # 홈 (개인화)
│           ├── BookList.js    # 도서 목록
│           ├── BookDetail.js  # 도서 상세
│           ├── MyPage.js      # 마이페이지
│           ├── SeatReservation.js # 좌석 예약
│           ├── Chatbot.js     # AI 챗봇
│           ├── Dashboard.js   # 관리자 대시보드
│           ├── AdminBooks.js  # 관리자 도서 관리
│           ├── AdminMembers.js # 관리자 회원 관리
│           ├── AdminLoans.js  # 관리자 대출 관리
│           └── AdminStatistics.js # 관리자 통계
└── database/
    ├── schema.sql             # 테이블 스키마
    ├── simple_test_data.sql   # 테스트 데이터
    └── full_backup.sql        # 전체 백업 (구조 + 데이터)
```

---

## 📊 API 엔드포인트 (50+)

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 도서
- `GET /api/books` - 전체 도서 조회
- `GET /api/books/:id` - 도서 상세
- `GET /api/books/search/:keyword` - 도서 검색

### 대출
- `POST /api/loans/borrow` - 대출
- `POST /api/loans/return/:loanId` - 반납
- `POST /api/loans/renew/:loanId` - 연장

### 예약
- `POST /api/reservations/create` - 예약 생성
- `DELETE /api/reservations/cancel/:reservationId` - 예약 취소

### 통계
- `GET /api/statistics/my-stats/:memberId` - 내 독서 통계
- `GET /api/statistics/recommended/:memberId` - 개인화 추천
- `GET /api/statistics/popular-books` - 인기 도서
- `GET /api/statistics/new-arrivals` - 신착 도서

### 좋아요
- `POST /api/likes/toggle` - 좋아요 토글
- `GET /api/likes/book/:bookId` - 좋아요 정보
- `GET /api/likes/loan-stats/:bookId` - 대출 통계

### AI 챗봇
- `POST /api/chatbot/chat` - AI 대화
- `GET /api/chatbot/faq` - FAQ 목록

### 관리자
- `POST /api/admin/books/add` - 도서 추가
- `PUT /api/admin/books/update/:bookId` - 도서 수정
- `DELETE /api/admin/books/delete/:bookId` - 도서 삭제
- `GET /api/admin/members/list` - 회원 목록
- `PUT /api/admin/members/suspend/:memberId` - 회원 정지
- `GET /api/admin/operations/loans/all` - 전체 대출 현황
- `POST /api/admin/operations/loans/force-return/:loanId` - 강제 반납

---

## 🎨 주요 화면

### 사용자
1. **홈**: 독서 통계, 차트, 개인 추천, 인기 도서
2. **도서 검색**: 실시간 검색, 카테고리 필터
3. **도서 상세**: 좋아요, 대출 통계 차트, 서평
4. **마이페이지**: 대출/예약/서평/필기 통합 관리
5. **좌석 예약**: 실시간 좌석 현황, 층별 배치도

### 관리자
1. **통계 대시보드**: Recharts 차트, TOP 10, 추이 분석
2. **도서 관리**: 모달 기반 CRUD, 재고 조정
3. **회원 관리**: 페이지네이션, 연체자 관리
4. **대출 관리**: 상태별 필터, 강제 반납

---

## 🛠️ 기술 스택

### Frontend
- React 18
- Axios
- Recharts (차트 라이브러리)
- CSS3 (그라데이션, 애니메이션)

### Backend
- Node.js
- Express.js
- MySQL2
- OpenAI API (gpt-4o-mini)
- JWT (인증)

### Database
- MySQL 8.0
- 11개 테이블
- 외래키 제약조건
- 트리거 (연체료 자동 계산)

---

## 📈 구현 완료 현황

### ✅ Phase 1: 기본 기능 (100%)
- 로그인/로그아웃
- 도서 검색/상세
- 대출/반납/연장
- 예약 시스템

### ✅ Phase 2: 개인화 기능 (100%)
- 개인화 대시보드
- 추천 시스템 (카테고리 기반)
- 독서 목표
- 독서 필기
- 서평 작성

### ✅ Phase 3: 소셜 기능 (100%)
- 좋아요 시스템
- 대출 통계 차트
- 좌석 예약

### ✅ Phase 4: AI 기능 (100%)
- OpenAI 챗봇
- 도서 추천
- FAQ 자동 응답

### ✅ Phase 5: 관리자 기능 (100%)
- 통합 대시보드
- 도서/회원/대출 관리
- 통계 리포트
- 관리자 로그

---

## 💡 핵심 알고리즘

### 1. 개인화 추천 시스템
```
1. 사용자의 대출 이력 분석
2. 선호 카테고리 TOP 3 추출
3. 해당 카테고리의 인기 도서 중 미대출 도서 추천
4. Cold Start: 대출 이력 없으면 전체 인기 도서 추천
```

### 2. 연체료 계산
```sql
연체료 = (반납일 - 반납예정일) * 500원
```

### 3. 예약 순위 시스템
```
- 예약 순서대로 우선순위 부여
- 책 반납 시 자동으로 다음 예약자에게 알림
```

---

## 🎓 배운 점

- **데이터베이스 설계**: 정규화, ERD, 트리거, 뷰
- **백엔드 아키텍처**: RESTful API, 에러 처리, 로깅
- **프론트엔드**: React Hooks, 상태 관리, 컴포넌트 설계
- **AI 통합**: OpenAI API, 프롬프트 엔지니어링
- **풀스택 개발**: API 연동, CORS, 인증

---

## 📝 개선 가능한 점

- [ ] 협업 필터링 추천 알고리즘
- [ ] 이메일/SMS 알림
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 도서 표지 이미지 업로드
- [ ] PWA (오프라인 지원)

---

## 👥 팀원

- **개발자**: 채희주
- **GitHub**: https://github.com/DataBase-Project-2025-2

---

## 📄 라이선스

MIT License

---

## 🙏 참고 자료

- [아주대학교 중앙도서관](https://library.ajou.ac.kr/)
- [Node.js](https://nodejs.org/)
- [React](https://reactjs.org/)
- [MySQL](https://dev.mysql.com/doc/)
- [OpenAI API](https://platform.openai.com/)

---

**⭐ 프로젝트가 도움이 되었다면 Star를 눌러주세요!**
