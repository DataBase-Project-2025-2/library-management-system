const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 도서 추가
router.post('/add', async (req, res) => {
  try {
    const {
      title,
      author,
      publisher,
      publication_year,
      isbn,
      category,
      total_copies,
      location
    } = req.body;

    // 유효성 검사
    if (!title || !author || !category) {
      return res.status(400).json({
        success: false,
        error: '필수 정보를 입력해주세요 (제목, 저자, 카테고리)'
      });
    }

    // ISBN 중복 체크
    if (isbn) {
      const [existing] = await db.query(
        'SELECT book_id FROM Books WHERE isbn = ?',
        [isbn]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: '이미 등록된 ISBN입니다'
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO Books (
        title, author, publisher, publication_year, isbn, 
        category, total_copies, available_copies, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        author,
        publisher || null,
        publication_year || null,
        isbn || null,
        category,
        total_copies || 1,
        total_copies || 1,
        location || '1층 종합자료실'
      ]
    );

    res.json({
      success: true,
      message: '도서가 추가되었습니다',
      data: { book_id: result.insertId }
    });
  } catch (error) {
    console.error('도서 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 추가 중 오류가 발생했습니다'
    });
  }
});

// 도서 수정
router.put('/update/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const {
      title,
      author,
      publisher,
      publication_year,
      isbn,
      category,
      total_copies,
      location
    } = req.body;

    // 도서 존재 확인
    const [book] = await db.query(
      'SELECT * FROM Books WHERE book_id = ?',
      [bookId]
    );

    if (book.length === 0) {
      return res.status(404).json({
        success: false,
        error: '도서를 찾을 수 없습니다'
      });
    }

    // ISBN 중복 체크 (다른 책과)
    if (isbn && isbn !== book[0].isbn) {
      const [existing] = await db.query(
        'SELECT book_id FROM Books WHERE isbn = ? AND book_id != ?',
        [isbn, bookId]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: '이미 다른 도서에서 사용 중인 ISBN입니다'
        });
      }
    }

    // 재고 수량 변경 시 대출 가능 수량 조정
    let available_copies = book[0].available_copies;
    if (total_copies !== undefined) {
      const diff = total_copies - book[0].total_copies;
      available_copies = book[0].available_copies + diff;
      
      // 대출 가능 수량은 0 이상이어야 함
      if (available_copies < 0) {
        return res.status(400).json({
          success: false,
          error: '대출 중인 책보다 총 재고를 적게 설정할 수 없습니다'
        });
      }
    }

    await db.query(
      `UPDATE Books SET
        title = COALESCE(?, title),
        author = COALESCE(?, author),
        publisher = COALESCE(?, publisher),
        publication_year = COALESCE(?, publication_year),
        isbn = COALESCE(?, isbn),
        category = COALESCE(?, category),
        total_copies = COALESCE(?, total_copies),
        available_copies = ?,
        location = COALESCE(?, location)
      WHERE book_id = ?`,
      [
        title,
        author,
        publisher,
        publication_year,
        isbn,
        category,
        total_copies,
        available_copies,
        location,
        bookId
      ]
    );

    res.json({
      success: true,
      message: '도서 정보가 수정되었습니다'
    });
  } catch (error) {
    console.error('도서 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 수정 중 오류가 발생했습니다'
    });
  }
});

// 도서 삭제 (소프트 삭제 - 대출 이력 있으면 삭제 불가)
router.delete('/delete/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    // 도서 존재 확인
    const [book] = await db.query(
      'SELECT * FROM Books WHERE book_id = ?',
      [bookId]
    );

    if (book.length === 0) {
      return res.status(404).json({
        success: false,
        error: '도서를 찾을 수 없습니다'
      });
    }

    // 대출 이력 확인
    const [loans] = await db.query(
      'SELECT COUNT(*) as count FROM Loans WHERE book_id = ?',
      [bookId]
    );

    if (loans[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: '대출 이력이 있는 도서는 삭제할 수 없습니다'
      });
    }

    // 예약 확인
    const [reservations] = await db.query(
      'SELECT COUNT(*) as count FROM Reservations WHERE book_id = ?',
      [bookId]
    );

    if (reservations[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: '예약이 있는 도서는 삭제할 수 없습니다'
      });
    }

    // 도서 삭제
    await db.query('DELETE FROM Books WHERE book_id = ?', [bookId]);

    res.json({
      success: true,
      message: '도서가 삭제되었습니다'
    });
  } catch (error) {
    console.error('도서 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 삭제 중 오류가 발생했습니다'
    });
  }
});

// 재고 조정
router.put('/adjust-stock/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { adjustment, reason } = req.body; // adjustment: +5, -2 등

    if (!adjustment || adjustment === 0) {
      return res.status(400).json({
        success: false,
        error: '조정 수량을 입력해주세요'
      });
    }

    const [book] = await db.query(
      'SELECT * FROM Books WHERE book_id = ?',
      [bookId]
    );

    if (book.length === 0) {
      return res.status(404).json({
        success: false,
        error: '도서를 찾을 수 없습니다'
      });
    }

    const newTotal = book[0].total_copies + adjustment;
    const newAvailable = book[0].available_copies + adjustment;

    if (newTotal < 0 || newAvailable < 0) {
      return res.status(400).json({
        success: false,
        error: '재고가 음수가 될 수 없습니다'
      });
    }

    // 대출 중인 책보다 적게 설정 불가
    const loanedCopies = book[0].total_copies - book[0].available_copies;
    if (newTotal < loanedCopies) {
      return res.status(400).json({
        success: false,
        error: '대출 중인 책보다 재고를 적게 설정할 수 없습니다'
      });
    }

    await db.query(
      `UPDATE Books SET 
        total_copies = ?,
        available_copies = ?
      WHERE book_id = ?`,
      [newTotal, newAvailable, bookId]
    );

    // 관리자 로그 기록
    await db.query(
      `INSERT INTO AdminLogs (admin_id, action_type, action_details, target_type, target_id)
       VALUES (1, 'stock_adjustment', ?, 'book', ?)`,
      [
        `재고 ${adjustment > 0 ? '+' : ''}${adjustment} (사유: ${reason || '없음'})`,
        bookId
      ]
    );

    res.json({
      success: true,
      message: '재고가 조정되었습니다',
      data: {
        previous_total: book[0].total_copies,
        new_total: newTotal,
        previous_available: book[0].available_copies,
        new_available: newAvailable
      }
    });
  } catch (error) {
    console.error('재고 조정 오류:', error);
    res.status(500).json({
      success: false,
      error: '재고 조정 중 오류가 발생했습니다'
    });
  }
});

// 도서 검색 (관리자용 - 상세 정보 포함)
router.get('/search', async (req, res) => {
  try {
    const { keyword, category, availability } = req.query;

    let query = `
      SELECT 
        b.*,
        COUNT(DISTINCT l.loan_id) as total_loans,
        COUNT(DISTINCT CASE WHEN l.return_date IS NULL THEN l.loan_id END) as current_loans,
        COUNT(DISTINCT r.reservation_id) as active_reservations
      FROM Books b
      LEFT JOIN Loans l ON b.book_id = l.book_id
      LEFT JOIN Reservations r ON b.book_id = r.book_id AND r.status = 'active'
      WHERE 1=1
    `;

    const params = [];

    if (keyword) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ` AND b.category = ?`;
      params.push(category);
    }

    if (availability === 'available') {
      query += ` AND b.available_copies > 0`;
    } else if (availability === 'unavailable') {
      query += ` AND b.available_copies = 0`;
    }

    query += ` GROUP BY b.book_id ORDER BY b.book_id DESC`;

    const [books] = await db.query(query, params);

    res.json({
      success: true,
      data: books
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
