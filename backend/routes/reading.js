const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 독서 목표 조회
router.get('/goals', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        rg.*,
        m.name as member_name,
        m.student_id
      FROM ReadingGoals rg
      JOIN Members m ON rg.member_id = m.member_id
      ORDER BY rg.created_at DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('독서 목표 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 목표 조회 중 오류가 발생했습니다'
    });
  }
});

// 회원별 독서 목표 조회
router.get('/goals/member/:memberId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM ReadingGoals
      WHERE member_id = ?
      ORDER BY year DESC
    `, [req.params.memberId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('회원 독서 목표 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 목표 조회 중 오류가 발생했습니다'
    });
  }
});

// 독서 목표 생성
router.post('/goals', async (req, res) => {
  const { member_id, year, target_books, goal_description } = req.body;
  
  if (!member_id || !year || !target_books) {
    return res.status(400).json({
      success: false,
      error: '회원 ID, 연도, 목표 권수는 필수입니다'
    });
  }
  
  try {
    const [result] = await db.query(
      'INSERT INTO ReadingGoals (member_id, year, target_books, current_books, goal_description) VALUES (?, ?, ?, 0, ?)',
      [member_id, year, target_books, goal_description || null]
    );
    
    res.status(201).json({
      success: true,
      message: '독서 목표가 생성되었습니다',
      data: {
        goal_id: result.insertId
      }
    });
  } catch (error) {
    console.error('독서 목표 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 목표 생성 중 오류가 발생했습니다'
    });
  }
});

// 모든 독서 이력 조회
router.get('/history', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        rh.*,
        m.name as member_name,
        m.student_id,
        b.title as book_title,
        b.author
      FROM ReadingHistory rh
      JOIN Members m ON rh.member_id = m.member_id
      JOIN Books b ON rh.book_id = b.book_id
      ORDER BY rh.read_date DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('독서 이력 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 이력 조회 중 오류가 발생했습니다'
    });
  }
});

// 회원별 독서 이력 조회
router.get('/history/member/:memberId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        rh.*,
        b.title,
        b.author,
        b.category
      FROM ReadingHistory rh
      JOIN Books b ON rh.book_id = b.book_id
      WHERE rh.member_id = ?
      ORDER BY rh.read_date DESC
    `, [req.params.memberId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('회원 독서 이력 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 이력 조회 중 오류가 발생했습니다'
    });
  }
});

// 독서 이력 생성
router.post('/history', async (req, res) => {
  const { member_id, book_id, read_date, reading_time, pages_read, notes } = req.body;
  
  if (!member_id || !book_id) {
    return res.status(400).json({
      success: false,
      error: '회원 ID, 도서 ID는 필수입니다'
    });
  }
  
  try {
    const [result] = await db.query(
      'INSERT INTO ReadingHistory (member_id, book_id, read_date, reading_time, pages_read, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [member_id, book_id, read_date || null, reading_time || null, pages_read || null, notes || null]
    );
    
    res.status(201).json({
      success: true,
      message: '독서 이력이 생성되었습니다',
      data: {
        history_id: result.insertId
      }
    });
  } catch (error) {
    console.error('독서 이력 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 이력 생성 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
