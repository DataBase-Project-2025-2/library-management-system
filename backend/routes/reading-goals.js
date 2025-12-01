const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 내 독서 목표 조회
router.get('/my-goal/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const year = new Date().getFullYear();
    
    // 1. 올해 목표 조회
    const [goals] = await db.query(`
      SELECT * FROM ReadingGoals
      WHERE member_id = ? AND year = ?
    `, [memberId, year]);
    
    // 2. 올해 읽은 책 수 (대출 완료된 책)
    const [loanCount] = await db.query(`
      SELECT COUNT(DISTINCT book_id) as books_read
      FROM Loans
      WHERE member_id = ? 
      AND YEAR(loan_date) = ?
      AND status IN ('returned', 'borrowed')
    `, [memberId, year]);
    
    const booksRead = loanCount[0].books_read || 0;
    
    if (goals.length === 0) {
      // 목표가 없으면 기본값 반환
      return res.json({
        success: true,
        data: {
          has_goal: false,
          year: year,
          target_books: 0,
          books_read: booksRead,
          progress: 0
        }
      });
    }
    
    const goal = goals[0];
    const progress = goal.target_books > 0 
      ? Math.min(100, Math.round((booksRead / goal.target_books) * 100))
      : 0;
    
    res.json({
      success: true,
      data: {
        has_goal: true,
        goal_id: goal.goal_id,
        year: goal.year,
        target_books: goal.target_books,
        books_read: booksRead,
        progress: progress
      }
    });
    
  } catch (error) {
    console.error('독서 목표 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 목표 조회 중 오류가 발생했습니다'
    });
  }
});

// 독서 목표 설정/수정
router.post('/set-goal', async (req, res) => {
  try {
    const { member_id, target_books } = req.body;
    const year = new Date().getFullYear();
    
    if (!member_id || !target_books) {
      return res.status(400).json({
        success: false,
        error: '회원 ID와 목표 권수는 필수입니다'
      });
    }
    
    if (target_books < 1 || target_books > 1000) {
      return res.status(400).json({
        success: false,
        error: '목표 권수는 1~1000 사이여야 합니다'
      });
    }
    
    // 기존 목표 확인
    const [existing] = await db.query(`
      SELECT goal_id FROM ReadingGoals
      WHERE member_id = ? AND year = ?
    `, [member_id, year]);
    
    if (existing.length > 0) {
      // 기존 목표 업데이트
      await db.query(`
        UPDATE ReadingGoals
        SET target_books = ?, updated_at = CURRENT_TIMESTAMP
        WHERE goal_id = ?
      `, [target_books, existing[0].goal_id]);
      
      res.json({
        success: true,
        message: '독서 목표가 수정되었습니다',
        data: {
          goal_id: existing[0].goal_id,
          year: year,
          target_books: target_books
        }
      });
    } else {
      // 새 목표 생성
      const [result] = await db.query(`
        INSERT INTO ReadingGoals (member_id, year, target_books)
        VALUES (?, ?, ?)
      `, [member_id, year, target_books]);
      
      res.json({
        success: true,
        message: '독서 목표가 설정되었습니다',
        data: {
          goal_id: result.insertId,
          year: year,
          target_books: target_books
        }
      });
    }
    
  } catch (error) {
    console.error('독서 목표 설정 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 목표 설정 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;