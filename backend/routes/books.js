const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 도서 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Books');
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('도서 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 도서 조회
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Books WHERE book_id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '도서를 찾을 수 없습니다'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('도서 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 조회 중 오류가 발생했습니다'
    });
  }
});

// 도서 검색
router.get('/search/:keyword', async (req, res) => {
  try {
    const keyword = `%${req.params.keyword}%`;
    const [rows] = await db.query(
      'SELECT * FROM Books WHERE title LIKE ? OR author LIKE ? OR keywords LIKE ?',
      [keyword, keyword, keyword]
    );
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('도서 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 검색 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
