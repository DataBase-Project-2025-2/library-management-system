const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 내 독서 노트 목록 조회 (별칭 라우트)
router.get('/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const [notes] = await db.query(`
      SELECT 
        rn.*,
        b.title,
        b.author,
        b.publisher,
        b.category,
        b.isbn
      FROM ReadingNotes rn
      JOIN Books b ON rn.book_id = b.book_id
      WHERE rn.member_id = ?
      ORDER BY rn.created_at DESC
    `, [memberId]);
    
    res.json({
      success: true,
      data: notes
    });
    
  } catch (error) {
    console.error('독서 노트 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// 내 독서 노트 목록 조회
router.get('/my-notes/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const [notes] = await db.query(`
      SELECT 
        rn.*,
        b.title,
        b.author,
        b.publisher,
        b.category,
        b.isbn
      FROM ReadingNotes rn
      JOIN Books b ON rn.book_id = b.book_id
      WHERE rn.member_id = ?
      ORDER BY rn.created_at DESC
    `, [memberId]);
    
    res.json({
      success: true,
      data: notes
    });
    
  } catch (error) {
    console.error('독서 노트 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 독서 노트 조회
router.get('/note/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const [notes] = await db.query(`
      SELECT 
        rn.*,
        b.title,
        b.author,
        b.publisher,
        b.category,
        b.isbn,
        b.cover_image
      FROM ReadingNotes rn
      JOIN Books b ON rn.book_id = b.book_id
      WHERE rn.note_id = ?
    `, [noteId]);
    
    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        error: '독서 노트를 찾을 수 없습니다'
      });
    }
    
    res.json({
      success: true,
      data: notes[0]
    });
    
  } catch (error) {
    console.error('독서 노트 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 조회 중 오류가 발생했습니다'
    });
  }
});

// 독서 노트 작성 (새 API 형식)
router.post('/', async (req, res) => {
  try {
    const { member_id, book_id, content, rating, favorite_quote, page_number } = req.body;
    
    if (!member_id || !book_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID와 도서 ID는 필수입니다'
      });
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '독서 노트 내용은 필수입니다'
      });
    }
    
    // 대출 이력 확인 (대출 중이거나 대출했던 적이 있어야 함)
    const [loanHistory] = await db.query(`
      SELECT loan_id FROM Loans
      WHERE member_id = ? AND book_id = ?
    `, [member_id, book_id]);
    
    if (loanHistory.length === 0) {
      return res.status(403).json({
        success: false,
        error: '이 책을 대출한 이력이 있어야 필기를 작성할 수 있습니다.'
      });
    }
    
    // 별점 검증
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: '별점은 1~5 사이여야 합니다'
      });
    }
    
    // 이미 노트가 있는지 확인
    const [existing] = await db.query(`
      SELECT note_id FROM ReadingNotes
      WHERE member_id = ? AND book_id = ?
    `, [member_id, book_id]);
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 이 책에 대한 독서 노트가 있습니다.'
      });
    }
    
    // 노트 생성
    const [result] = await db.query(`
      INSERT INTO ReadingNotes (member_id, book_id, summary, favorite_quote, rating, key_points)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [member_id, book_id, content, favorite_quote || null, rating || null, page_number || null]);
    
    res.json({
      success: true,
      message: '독서 노트가 작성되었습니다',
      data: {
        note_id: result.insertId
      }
    });
    
  } catch (error) {
    console.error('독서 노트 작성 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 작성 중 오류가 발생했습니다'
    });
  }
});

// 독서 노트 수정 (새 API 형식)
router.put('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, rating, favorite_quote, page_number } = req.body;
    
    // 노트 존재 확인
    const [notes] = await db.query('SELECT * FROM ReadingNotes WHERE note_id = ?', [noteId]);
    
    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        error: '독서 노트를 찾을 수 없습니다'
      });
    }
    
    // 별점 검증
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: '별점은 1~5 사이여야 합니다'
      });
    }
    
    // 노트 수정
    await db.query(`
      UPDATE ReadingNotes
      SET summary = ?, favorite_quote = ?, rating = ?, key_points = ?, updated_at = CURRENT_TIMESTAMP
      WHERE note_id = ?
    `, [content, favorite_quote || null, rating || null, page_number || null, noteId]);
    
    res.json({
      success: true,
      message: '독서 노트가 수정되었습니다'
    });
    
  } catch (error) {
    console.error('독서 노트 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 수정 중 오류가 발생했습니다'
    });
  }
});

// 독서 노트 작성 (기존)
router.post('/create', async (req, res) => {
  try {
    const { member_id, book_id, loan_id, summary, key_points, favorite_quote, rating, tags } = req.body;
    
    if (!member_id || !book_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID와 도서 ID는 필수입니다'
      });
    }
    
    // 별점 검증
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: '별점은 1~5 사이여야 합니다'
      });
    }
    
    // 이미 노트가 있는지 확인
    const [existing] = await db.query(`
      SELECT note_id FROM ReadingNotes
      WHERE member_id = ? AND book_id = ?
    `, [member_id, book_id]);
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 이 책에 대한 독서 노트가 있습니다. 수정 기능을 이용해주세요.'
      });
    }
    
    // 노트 생성
    const [result] = await db.query(`
      INSERT INTO ReadingNotes (member_id, book_id, loan_id, summary, key_points, favorite_quote, rating, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [member_id, book_id, loan_id || null, summary || null, key_points || null, favorite_quote || null, rating || null, tags || null]);
    
    res.json({
      success: true,
      message: '독서 노트가 작성되었습니다',
      data: {
        note_id: result.insertId
      }
    });
    
  } catch (error) {
    console.error('독서 노트 작성 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 작성 중 오류가 발생했습니다'
    });
  }
});

// 독서 노트 수정
router.put('/update/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { summary, key_points, favorite_quote, rating, tags } = req.body;
    
    // 노트 존재 확인
    const [notes] = await db.query('SELECT * FROM ReadingNotes WHERE note_id = ?', [noteId]);
    
    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        error: '독서 노트를 찾을 수 없습니다'
      });
    }
    
    // 별점 검증
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: '별점은 1~5 사이여야 합니다'
      });
    }
    
    // 노트 수정
    await db.query(`
      UPDATE ReadingNotes
      SET summary = ?, key_points = ?, favorite_quote = ?, rating = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE note_id = ?
    `, [summary || null, key_points || null, favorite_quote || null, rating || null, tags || null, noteId]);
    
    res.json({
      success: true,
      message: '독서 노트가 수정되었습니다'
    });
    
  } catch (error) {
    console.error('독서 노트 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 수정 중 오류가 발생했습니다'
    });
  }
});

// 독서 노트 삭제
router.delete('/delete/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // 노트 존재 확인
    const [notes] = await db.query('SELECT * FROM ReadingNotes WHERE note_id = ?', [noteId]);
    
    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        error: '독서 노트를 찾을 수 없습니다'
      });
    }
    
    // 노트 삭제
    await db.query('DELETE FROM ReadingNotes WHERE note_id = ?', [noteId]);
    
    res.json({
      success: true,
      message: '독서 노트가 삭제되었습니다'
    });
    
  } catch (error) {
    console.error('독서 노트 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '독서 노트 삭제 중 오류가 발생했습니다'
    });
  }
});

// 특정 책에 대한 노트 확인
router.get('/check/:memberId/:bookId', async (req, res) => {
  try {
    const { memberId, bookId } = req.params;
    
    const [notes] = await db.query(`
      SELECT note_id, rating FROM ReadingNotes
      WHERE member_id = ? AND book_id = ?
    `, [memberId, bookId]);
    
    res.json({
      success: true,
      data: {
        has_note: notes.length > 0,
        note_id: notes.length > 0 ? notes[0].note_id : null,
        rating: notes.length > 0 ? notes[0].rating : null
      }
    });
    
  } catch (error) {
    console.error('노트 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '노트 확인 중 오류가 발생했습니다'
    });
  }
});

// 통계 - 총 작성한 노트 수
router.get('/stats/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_notes,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as high_rated_books
      FROM ReadingNotes
      WHERE member_id = ?
    `, [memberId]);
    
    res.json({
      success: true,
      data: stats[0]
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