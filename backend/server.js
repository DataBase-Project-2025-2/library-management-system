// Express 서버 메인 파일
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
const authRoutes = require('./routes/auth');
const membersRoutes = require('./routes/members');
const booksRoutes = require('./routes/books');
const loansRoutes = require('./routes/loans');
const reservationsRoutes = require('./routes/reservations');
const reviewsRoutes = require('./routes/reviews');
const statisticsRoutes = require('./routes/statistics');
const readingRoutes = require('./routes/reading');

app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reading', readingRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '아주대학교 차세대 도서관 관리 시스템 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      members: '/api/members',
      books: '/api/books',
      loans: '/api/loans',
      reservations: '/api/reservations',
      reviews: '/api/reviews',
      statistics: '/api/statistics',
      reading: '/api/reading'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;
