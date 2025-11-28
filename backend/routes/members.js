const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 회원 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Members');
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('회원 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 회원 조회
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Members WHERE member_id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '회원을 찾을 수 없습니다'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('회원 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
