const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 리뷰 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        m.name as member_name,
        m.student_id,
        b.title as book_title,
        b.author
      FROM Reviews r
      JOIN Members m ON r.member_id = m.member_id
      JOIN Books b ON r.book_id = b.book_id
      ORDER BY r.review_date DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 도서의 리뷰 조회
router.get('/book/:bookId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        m.name as member_name,
        m.student_id,
        m.department
      FROM Reviews r
      JOIN Members m ON r.member_id = m.member_id
      WHERE r.book_id = ?
      ORDER BY r.review_date DESC
    `, [req.params.bookId]);
    
    // 평균 별점 계산
    const [avgRating] = await db.query(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as review_count
      FROM Reviews
      WHERE book_id = ?
    `, [req.params.bookId]);
    
    res.json({
      success: true,
      count: rows.length,
      average_rating: avgRating[0].average_rating ? parseFloat(avgRating[0].average_rating).toFixed(1) : null,
      review_count: avgRating[0].review_count,
      data: rows
    });
  } catch (error) {
    console.error('도서 리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 회원의 리뷰 조회
router.get('/member/:memberId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        b.title as book_title,
        b.author,
        b.isbn
      FROM Reviews r
      JOIN Books b ON r.book_id = b.book_id
      WHERE r.member_id = ?
      ORDER BY r.review_date DESC
    `, [req.params.memberId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('회원 리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 리뷰 조회
router.get('/:reviewId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        m.name as member_name,
        m.student_id,
        b.title as book_title,
        b.author
      FROM Reviews r
      JOIN Members m ON r.member_id = m.member_id
      JOIN Books b ON r.book_id = b.book_id
      WHERE r.review_id = ?
    `, [req.params.reviewId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 조회 중 오류가 발생했습니다'
    });
  }
});

// 리뷰 작성
router.post('/', async (req, res) => {
  const { member_id, book_id, rating, comment } = req.body;
  
  // 유효성 검증
  if (!member_id || !book_id || !rating) {
    return res.status(400).json({
      success: false,
      error: '회원 ID, 도서 ID, 별점은 필수입니다'
    });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: '별점은 1~5 사이여야 합니다'
    });
  }
  
  try {
    // 1. 도서 존재 확인
    const [books] = await db.query(
      'SELECT book_id FROM Books WHERE book_id = ?',
      [book_id]
    );
    
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        error: '도서를 찾을 수 없습니다'
      });
    }
    
    // 2. 회원 존재 확인
    const [members] = await db.query(
      'SELECT member_id FROM Members WHERE member_id = ?',
      [member_id]
    );
    
    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        error: '회원을 찾을 수 없습니다'
      });
    }
    
    // 3. 이미 리뷰 작성했는지 확인
    const [existingReviews] = await db.query(
      'SELECT review_id FROM Reviews WHERE member_id = ? AND book_id = ?',
      [member_id, book_id]
    );
    
    if (existingReviews.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 이 도서에 대한 리뷰를 작성하셨습니다'
      });
    }
    
    // 4. 리뷰 작성
    const [result] = await db.query(
      'INSERT INTO Reviews (member_id, book_id, rating, comment, review_date) VALUES (?, ?, ?, ?, CURDATE())',
      [member_id, book_id, rating, comment || null]
    );
    
    res.status(201).json({
      success: true,
      message: '리뷰가 작성되었습니다',
      data: {
        review_id: result.insertId
      }
    });
    
  } catch (error) {
    console.error('리뷰 작성 오류:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 작성 중 오류가 발생했습니다'
    });
  }
});

// 리뷰 수정
router.put('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  
  // 유효성 검증
  if (!rating && !comment) {
    return res.status(400).json({
      success: false,
      error: '수정할 내용을 입력해주세요'
    });
  }
  
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      success: false,
      error: '별점은 1~5 사이여야 합니다'
    });
  }
  
  try {
    // 1. 리뷰 존재 확인
    const [reviews] = await db.query(
      'SELECT * FROM Reviews WHERE review_id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다'
      });
    }
    
    // 2. 업데이트할 필드 준비
    let updateFields = [];
    let updateValues = [];
    
    if (rating) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }
    
    if (comment !== undefined) {
      updateFields.push('comment = ?');
      updateValues.push(comment);
    }
    
    updateValues.push(reviewId);
    
    // 3. 리뷰 수정
    await db.query(
      `UPDATE Reviews SET ${updateFields.join(', ')} WHERE review_id = ?`,
      updateValues
    );
    
    res.json({
      success: true,
      message: '리뷰가 수정되었습니다'
    });
    
  } catch (error) {
    console.error('리뷰 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 수정 중 오류가 발생했습니다'
    });
  }
});

// 리뷰 삭제
router.delete('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  
  try {
    // 1. 리뷰 존재 확인
    const [reviews] = await db.query(
      'SELECT * FROM Reviews WHERE review_id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다'
      });
    }
    
    // 2. 리뷰 삭제
    await db.query(
      'DELETE FROM Reviews WHERE review_id = ?',
      [reviewId]
    );
    
    res.json({
      success: true,
      message: '리뷰가 삭제되었습니다'
    });
    
  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '리뷰 삭제 중 오류가 발생했습니다'
    });
  }
});

// 리뷰 좋아요
router.post('/:reviewId/like', async (req, res) => {
  const { reviewId } = req.params;
  
  try {
    // 1. 리뷰 존재 확인
    const [reviews] = await db.query(
      'SELECT * FROM Reviews WHERE review_id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: '리뷰를 찾을 수 없습니다'
      });
    }
    
    // 2. 좋아요 수 증가
    await db.query(
      'UPDATE Reviews SET likes_count = likes_count + 1 WHERE review_id = ?',
      [reviewId]
    );
    
    // 3. 업데이트된 좋아요 수 조회
    const [updatedReview] = await db.query(
      'SELECT likes_count FROM Reviews WHERE review_id = ?',
      [reviewId]
    );
    
    res.json({
      success: true,
      message: '좋아요가 추가되었습니다',
      data: {
        likes_count: updatedReview[0].likes_count
      }
    });
    
  } catch (error) {
    console.error('좋아요 오류:', error);
    res.status(500).json({
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다'
    });
  }
});

// 도서별 평균 별점 조회
router.get('/stats/book/:bookId', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM Reviews
      WHERE book_id = ?
    `, [req.params.bookId]);
    
    res.json({
      success: true,
      data: {
        total_reviews: stats[0].total_reviews,
        average_rating: stats[0].average_rating ? parseFloat(stats[0].average_rating).toFixed(1) : null,
        rating_distribution: {
          5: stats[0].five_star,
          4: stats[0].four_star,
          3: stats[0].three_star,
          2: stats[0].two_star,
          1: stats[0].one_star
        }
      }
    });
    
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
