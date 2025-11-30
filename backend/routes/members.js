const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ëª¨ë“  íšŒì› ì¡°íšŒ
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Members');
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('íšŒì› ì¡°íšŒ ì˜¤ë¥˜:', error);
    res.status(500).json({
      success: false,
      error: 'íšŒì› ì¡°íšŒ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤'
    });
  }
});

// íŠ¹ì • íšŒì› ì¡°íšŒ
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Members WHERE member_id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'íšŒì›ì„ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('íšŒì› ì¡°íšŒ ì˜¤ë¥˜:', error);
    res.status(500).json({
      success: false,
      error: 'íšŒì› ì¡°íšŒ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤'
    });
  }
});

module.exports = router;

// È¸¿øº° ´ëÃâ ¸ñ·Ï Á¶È¸
router.get('/:id/loans', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, b.title, b.author, b.publisher 
       FROM Loans l
       JOIN Books b ON l.book_id = b.book_id
       WHERE l.member_id = ?
       ORDER BY l.loan_date DESC`,
      [req.params.id]
    );
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('´ëÃâ ¸ñ·Ï Á¶È¸ ¿À·ù:', error);
    res.status(500).json({
      success: false,
      error: '´ëÃâ ¸ñ·Ï Á¶È¸ Áß ¿À·ù°¡ ¹ß»ýÇß½À´Ï´Ù'
    });
  }
});

// È¸¿øº° ¿¹¾à ¸ñ·Ï Á¶È¸
router.get('/:id/reservations', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, b.title, b.author, b.publisher 
       FROM Reservations r
       JOIN Books b ON r.book_id = b.book_id
       WHERE r.member_id = ?
       ORDER BY r.reservation_date DESC`,
      [req.params.id]
    );
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('¿¹¾à ¸ñ·Ï Á¶È¸ ¿À·ù:', error);
    res.status(500).json({
      success: false,
      error: '¿¹¾à ¸ñ·Ï Á¶È¸ Áß ¿À·ù°¡ ¹ß»ýÇß½À´Ï´Ù'
    });
  }
});

// È¸¿øº° ¼­Æò ¸ñ·Ï Á¶È¸
router.get('/:id/reviews', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, b.title, b.author, b.publisher 
       FROM Reviews r
       JOIN Books b ON r.book_id = b.book_id
       WHERE r.member_id = ?
       ORDER BY r.review_date DESC`,
      [req.params.id]
    );
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('¼­Æò ¸ñ·Ï Á¶È¸ ¿À·ù:', error);
    res.status(500).json({
      success: false,
      error: '¼­Æò ¸ñ·Ï Á¶È¸ Áß ¿À·ù°¡ ¹ß»ýÇß½À´Ï´Ù'
    });
  }
});

// È¸¿øº° µ¶¼­ ¸ñÇ¥ Á¶È¸
router.get('/:id/goals', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM ReadingGoals 
       WHERE member_id = ?
       ORDER BY year DESC`,
      [req.params.id]
    );
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('µ¶¼­ ¸ñÇ¥ Á¶È¸ ¿À·ù:', error);
    res.status(500).json({
      success: false,
      error: 'µ¶¼­ ¸ñÇ¥ Á¶È¸ Áß ¿À·ù°¡ ¹ß»ýÇß½À´Ï´Ù'
    });
  }
});
