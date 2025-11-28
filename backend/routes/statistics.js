const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 대시보드 전체 통계
router.get('/dashboard', async (req, res) => {
  try {
    // 1. 전체 통계
    const [totalStats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM Members WHERE status = 'active') as total_members,
        (SELECT COUNT(*) FROM Books) as total_books,
        (SELECT SUM(total_copies) FROM Books) as total_copies,
        (SELECT SUM(available_copies) FROM Books) as available_copies,
        (SELECT COUNT(*) FROM Loans WHERE status = 'borrowed') as current_loans,
        (SELECT COUNT(*) FROM Loans WHERE status = 'overdue') as overdue_loans,
        (SELECT COUNT(*) FROM Reservations WHERE status = 'active') as active_reservations
    `);
    
    res.json({
      success: true,
      data: totalStats[0]
    });
    
  } catch (error) {
    console.error('대시보드 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다'
    });
  }
});

// 인기 도서 TOP 10 (대출 횟수 기준)
router.get('/popular-books', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const [books] = await db.query(`
      SELECT 
        b.book_id,
        b.title,
        b.author,
        b.category,
        b.isbn,
        COUNT(l.loan_id) as loan_count,
        AVG(r.rating) as average_rating,
        COUNT(DISTINCT r.review_id) as review_count
      FROM Books b
      LEFT JOIN Loans l ON b.book_id = l.book_id
      LEFT JOIN Reviews r ON b.book_id = r.book_id
      GROUP BY b.book_id
      ORDER BY loan_count DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    res.json({
      success: true,
      count: books.length,
      data: books.map(book => ({
        ...book,
        average_rating: book.average_rating ? parseFloat(book.average_rating).toFixed(1) : null
      }))
    });
    
  } catch (error) {
    console.error('인기 도서 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '인기 도서 조회 중 오류가 발생했습니다'
    });
  }
});

// 카테고리별 대출 통계
router.get('/category-stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        b.category,
        COUNT(DISTINCT b.book_id) as book_count,
        COUNT(l.loan_id) as total_loans,
        COUNT(DISTINCT l.member_id) as unique_borrowers,
        AVG(r.rating) as average_rating
      FROM Books b
      LEFT JOIN Loans l ON b.book_id = l.book_id
      LEFT JOIN Reviews r ON b.book_id = r.book_id
      GROUP BY b.category
      ORDER BY total_loans DESC
    `);
    
    res.json({
      success: true,
      data: stats.map(stat => ({
        ...stat,
        average_rating: stat.average_rating ? parseFloat(stat.average_rating).toFixed(1) : null
      }))
    });
    
  } catch (error) {
    console.error('카테고리 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 통계 조회 중 오류가 발생했습니다'
    });
  }
});

// 회원별 독서 통계
router.get('/member-stats/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // 1. 기본 통계
    const [basicStats] = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'returned' THEN 1 END) as books_read,
        COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as currently_reading,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        SUM(fine_amount) as total_fines
      FROM Loans
      WHERE member_id = ?
    `, [memberId]);
    
    // 2. 리뷰 통계
    const [reviewStats] = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating_given
      FROM Reviews
      WHERE member_id = ?
    `, [memberId]);
    
    // 3. 선호 카테고리
    const [favoriteCategories] = await db.query(`
      SELECT 
        b.category,
        COUNT(*) as loan_count
      FROM Loans l
      JOIN Books b ON l.book_id = b.book_id
      WHERE l.member_id = ?
      GROUP BY b.category
      ORDER BY loan_count DESC
      LIMIT 5
    `, [memberId]);
    
    // 4. 최근 대출 도서
    const [recentLoans] = await db.query(`
      SELECT 
        b.title,
        b.author,
        l.loan_date,
        l.return_date,
        l.status
      FROM Loans l
      JOIN Books b ON l.book_id = b.book_id
      WHERE l.member_id = ?
      ORDER BY l.loan_date DESC
      LIMIT 5
    `, [memberId]);
    
    res.json({
      success: true,
      data: {
        basic_stats: basicStats[0],
        review_stats: {
          ...reviewStats[0],
          average_rating_given: reviewStats[0].average_rating_given ? 
            parseFloat(reviewStats[0].average_rating_given).toFixed(1) : null
        },
        favorite_categories: favoriteCategories,
        recent_loans: recentLoans
      }
    });
    
  } catch (error) {
    console.error('회원 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 통계 조회 중 오류가 발생했습니다'
    });
  }
});

// 월별 대출 현황 (최근 12개월)
router.get('/monthly-loans', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        DATE_FORMAT(loan_date, '%Y-%m') as month,
        COUNT(*) as total_loans,
        COUNT(DISTINCT member_id) as unique_members,
        COUNT(DISTINCT book_id) as unique_books
      FROM Loans
      WHERE loan_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(loan_date, '%Y-%m')
      ORDER BY month DESC
    `);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('월별 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: '월별 통계 조회 중 오류가 발생했습니다'
    });
  }
});

// 연체 현황 통계
router.get('/overdue-stats', async (req, res) => {
  try {
    // 1. 전체 연체 통계
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(*) as total_overdue,
        SUM(DATEDIFF(CURDATE(), due_date)) as total_overdue_days,
        SUM(fine_amount) as total_fines,
        AVG(DATEDIFF(CURDATE(), due_date)) as avg_overdue_days
      FROM Loans
      WHERE status = 'overdue'
    `);
    
    // 2. 연체 도서 목록
    const [overdueBooks] = await db.query(`
      SELECT 
        l.loan_id,
        m.name as member_name,
        m.student_id,
        b.title as book_title,
        l.due_date,
        DATEDIFF(CURDATE(), l.due_date) as overdue_days,
        l.fine_amount
      FROM Loans l
      JOIN Members m ON l.member_id = m.member_id
      JOIN Books b ON l.book_id = b.book_id
      WHERE l.status = 'overdue'
      ORDER BY overdue_days DESC
      LIMIT 20
    `);
    
    // 3. 연체 다발 회원
    const [frequentOverdueMembers] = await db.query(`
      SELECT 
        m.member_id,
        m.name,
        m.student_id,
        COUNT(*) as overdue_count,
        SUM(l.fine_amount) as total_fines
      FROM Loans l
      JOIN Members m ON l.member_id = m.member_id
      WHERE l.status = 'overdue'
      GROUP BY m.member_id
      ORDER BY overdue_count DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        overall_stats: {
          ...overallStats[0],
          avg_overdue_days: overallStats[0].avg_overdue_days ? 
            parseFloat(overallStats[0].avg_overdue_days).toFixed(1) : null
        },
        overdue_books: overdueBooks,
        frequent_overdue_members: frequentOverdueMembers
      }
    });
    
  } catch (error) {
    console.error('연체 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: '연체 통계 조회 중 오류가 발생했습니다'
    });
  }
});

// 최고 평점 도서
router.get('/top-rated-books', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const minReviews = req.query.minReviews || 1;
    
    const [books] = await db.query(`
      SELECT 
        b.book_id,
        b.title,
        b.author,
        b.category,
        AVG(r.rating) as average_rating,
        COUNT(r.review_id) as review_count,
        SUM(r.likes_count) as total_likes
      FROM Books b
      JOIN Reviews r ON b.book_id = r.book_id
      GROUP BY b.book_id
      HAVING review_count >= ?
      ORDER BY average_rating DESC, review_count DESC
      LIMIT ?
    `, [parseInt(minReviews), parseInt(limit)]);
    
    res.json({
      success: true,
      count: books.length,
      data: books.map(book => ({
        ...book,
        average_rating: parseFloat(book.average_rating).toFixed(1)
      }))
    });
    
  } catch (error) {
    console.error('최고 평점 도서 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '최고 평점 도서 조회 중 오류가 발생했습니다'
    });
  }
});

// 학과별 대출 통계
router.get('/department-stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        m.department,
        COUNT(DISTINCT m.member_id) as member_count,
        COUNT(l.loan_id) as total_loans,
        ROUND(COUNT(l.loan_id) / COUNT(DISTINCT m.member_id), 1) as avg_loans_per_member
      FROM Members m
      LEFT JOIN Loans l ON m.member_id = l.member_id
      GROUP BY m.department
      ORDER BY total_loans DESC
    `);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('학과별 통계 오류:', error);
    res.status(500).json({
      success: false,
      error: '학과별 통계 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
