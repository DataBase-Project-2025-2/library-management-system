const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 책 좋아요 추가/취소 (토글)
router.post('/toggle', async (req, res) => {
  try {
    const { member_id, book_id } = req.body;
    
    if (!member_id || !book_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID와 도서 ID는 필수입니다'
      });
    }
    
    // 이미 좋아요 했는지 확인
    const [existing] = await db.query(`
      SELECT like_id FROM BookLikes
      WHERE member_id = ? AND book_id = ?
    `, [member_id, book_id]);
    
    if (existing.length > 0) {
      // 좋아요 취소
      await db.query('DELETE FROM BookLikes WHERE like_id = ?', [existing[0].like_id]);
      
      res.json({
        success: true,
        action: 'unliked',
        message: '좋아요가 취소되었습니다'
      });
    } else {
      // 좋아요 추가
      await db.query(`
        INSERT INTO BookLikes (member_id, book_id)
        VALUES (?, ?)
      `, [member_id, book_id]);
      
      res.json({
        success: true,
        action: 'liked',
        message: '좋아요가 추가되었습니다'
      });
    }
    
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다'
    });
  }
});

// 특정 책의 좋아요 수와 사용자의 좋아요 여부
router.get('/book/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { memberId } = req.query;
    
    // 총 좋아요 수
    const [likeCount] = await db.query(`
      SELECT COUNT(*) as total_likes
      FROM BookLikes
      WHERE book_id = ?
    `, [bookId]);
    
    // 사용자의 좋아요 여부
    let isLiked = false;
    if (memberId) {
      const [userLike] = await db.query(`
        SELECT like_id FROM BookLikes
        WHERE member_id = ? AND book_id = ?
      `, [memberId, bookId]);
      isLiked = userLike.length > 0;
    }
    
    res.json({
      success: true,
      data: {
        total_likes: likeCount[0].total_likes,
        is_liked: isLiked
      }
    });
    
  } catch (error) {
    console.error('좋아요 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '좋아요 정보 조회 중 오류가 발생했습니다'
    });
  }
});

// 대출 통계 (월별 대출 횟수)
router.get('/loan-stats/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const [stats] = await db.query(`
      SELECT 
        DATE_FORMAT(loan_date, '%Y-%m') as month,
        COUNT(*) as loan_count
      FROM Loans
      WHERE book_id = ?
      AND loan_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(loan_date, '%Y-%m')
      ORDER BY month ASC
    `, [bookId]);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('대출 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '대출 통계 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
