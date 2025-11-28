const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 예약 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        m.name as member_name,
        m.student_id,
        m.phone,
        b.title as book_title,
        b.author,
        b.isbn
      FROM Reservations r
      JOIN Members m ON r.member_id = m.member_id
      JOIN Books b ON r.book_id = b.book_id
      ORDER BY r.reservation_date DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('예약 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 회원의 예약 조회
router.get('/member/:memberId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        b.title,
        b.author,
        b.isbn,
        b.available_copies
      FROM Reservations r
      JOIN Books b ON r.book_id = b.book_id
      WHERE r.member_id = ?
      ORDER BY r.reservation_date DESC
    `, [req.params.memberId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('회원 예약 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 조회 중 오류가 발생했습니다'
    });
  }
});

// 활성 예약 조회
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        m.name as member_name,
        m.student_id,
        m.phone,
        m.email,
        b.title as book_title,
        b.author,
        DATEDIFF(r.expiry_date, CURDATE()) as days_remaining
      FROM Reservations r
      JOIN Members m ON r.member_id = m.member_id
      JOIN Books b ON r.book_id = b.book_id
      WHERE r.status = 'active'
      ORDER BY r.expiry_date ASC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('활성 예약 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '활성 예약 조회 중 오류가 발생했습니다'
    });
  }
});

// 도서 예약
router.post('/create', async (req, res) => {
  const { member_id, book_id } = req.body;
  
  if (!member_id || !book_id) {
    return res.status(400).json({
      success: false,
      error: '회원 ID와 도서 ID를 모두 입력해주세요'
    });
  }
  
  try {
    // 1. 도서 정보 확인
    const [books] = await db.query(
      'SELECT available_copies FROM Books WHERE book_id = ?',
      [book_id]
    );
    
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        error: '도서를 찾을 수 없습니다'
      });
    }
    
    // 2. 재고가 있으면 예약 불가 (대출 가능)
    if (books[0].available_copies > 0) {
      return res.status(400).json({
        success: false,
        error: '대출 가능한 도서입니다. 예약 대신 대출을 진행해주세요'
      });
    }
    
    // 3. 이미 예약했는지 확인
    const [existingReservations] = await db.query(
      'SELECT * FROM Reservations WHERE member_id = ? AND book_id = ? AND status = "active"',
      [member_id, book_id]
    );
    
    if (existingReservations.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 예약한 도서입니다'
      });
    }
    
    // 4. 회원의 현재 활성 예약 수 확인
    const [activeReservations] = await db.query(
      'SELECT COUNT(*) as count FROM Reservations WHERE member_id = ? AND status = "active"',
      [member_id]
    );
    
    if (activeReservations[0].count >= 3) {
      return res.status(400).json({
        success: false,
        error: '최대 예약 권수(3권)를 초과했습니다'
      });
    }
    
    // 5. 예약 생성 (유효기간 7일)
    const reservation_date = new Date();
    const expiry_date = new Date();
    expiry_date.setDate(expiry_date.getDate() + 7);
    
    const [result] = await db.query(
      'INSERT INTO Reservations (member_id, book_id, reservation_date, expiry_date, status) VALUES (?, ?, ?, ?, ?)',
      [member_id, book_id, reservation_date, expiry_date, 'active']
    );
    
    res.status(201).json({
      success: true,
      message: '도서 예약이 완료되었습니다',
      data: {
        reservation_id: result.insertId,
        reservation_date,
        expiry_date
      }
    });
    
  } catch (error) {
    console.error('도서 예약 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 예약 중 오류가 발생했습니다'
    });
  }
});

// 예약 취소
router.delete('/:reservationId', async (req, res) => {
  const { reservationId } = req.params;
  
  try {
    // 1. 예약 정보 확인
    const [reservations] = await db.query(
      'SELECT * FROM Reservations WHERE reservation_id = ?',
      [reservationId]
    );
    
    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다'
      });
    }
    
    const reservation = reservations[0];
    
    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: '활성 상태의 예약만 취소할 수 있습니다'
      });
    }
    
    // 2. 예약 상태 업데이트
    await db.query(
      'UPDATE Reservations SET status = ? WHERE reservation_id = ?',
      ['cancelled', reservationId]
    );
    
    res.json({
      success: true,
      message: '예약이 취소되었습니다'
    });
    
  } catch (error) {
    console.error('예약 취소 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 취소 중 오류가 발생했습니다'
    });
  }
});

// 예약 알림 발송 (관리자용)
router.post('/notify/:reservationId', async (req, res) => {
  const { reservationId } = req.params;
  
  try {
    // 1. 예약 정보 조회
    const [reservations] = await db.query(`
      SELECT 
        r.*,
        m.name,
        m.email,
        m.phone,
        b.title
      FROM Reservations r
      JOIN Members m ON r.member_id = m.member_id
      JOIN Books b ON r.book_id = b.book_id
      WHERE r.reservation_id = ?
    `, [reservationId]);
    
    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다'
      });
    }
    
    const reservation = reservations[0];
    
    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: '활성 상태의 예약만 알림을 보낼 수 있습니다'
      });
    }
    
    // 2. 알림 발송 표시 (실제로는 이메일/SMS 발송)
    await db.query(
      'UPDATE Reservations SET notification_sent = TRUE WHERE reservation_id = ?',
      [reservationId]
    );
    
    res.json({
      success: true,
      message: '예약 알림이 발송되었습니다',
      data: {
        member_name: reservation.name,
        email: reservation.email,
        phone: reservation.phone,
        book_title: reservation.title
      }
    });
    
  } catch (error) {
    console.error('예약 알림 발송 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 알림 발송 중 오류가 발생했습니다'
    });
  }
});

// 예약 이행 (도서가 반납되어 대출 가능할 때)
router.post('/fulfill/:reservationId', async (req, res) => {
  const { reservationId } = req.params;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. 예약 정보 확인
    const [reservations] = await connection.query(
      'SELECT * FROM Reservations WHERE reservation_id = ?',
      [reservationId]
    );
    
    if (reservations.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다'
      });
    }
    
    const reservation = reservations[0];
    
    if (reservation.status !== 'active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: '활성 상태의 예약만 이행할 수 있습니다'
      });
    }
    
    // 2. 도서 재고 확인
    const [books] = await connection.query(
      'SELECT available_copies FROM Books WHERE book_id = ?',
      [reservation.book_id]
    );
    
    if (books[0].available_copies <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: '대출 가능한 도서가 없습니다'
      });
    }
    
    // 3. 예약 상태를 'fulfilled'로 변경
    await connection.query(
      'UPDATE Reservations SET status = ? WHERE reservation_id = ?',
      ['fulfilled', reservationId]
    );
    
    // 4. 자동으로 대출 진행
    const loan_date = new Date();
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 14);
    
    const [loanResult] = await connection.query(
      'INSERT INTO Loans (member_id, book_id, loan_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [reservation.member_id, reservation.book_id, loan_date, due_date, 'borrowed']
    );
    
    // 5. 도서 재고 감소
    await connection.query(
      'UPDATE Books SET available_copies = available_copies - 1 WHERE book_id = ?',
      [reservation.book_id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: '예약이 이행되어 자동으로 대출되었습니다',
      data: {
        loan_id: loanResult.insertId,
        loan_date,
        due_date
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('예약 이행 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 이행 중 오류가 발생했습니다'
    });
  } finally {
    connection.release();
  }
});

// 만료된 예약 정리 (스케줄러용)
router.post('/cleanup-expired', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE Reservations SET status = ? WHERE status = ? AND expiry_date < CURDATE()',
      ['expired', 'active']
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows}개의 만료된 예약이 정리되었습니다`,
      count: result.affectedRows
    });
    
  } catch (error) {
    console.error('만료 예약 정리 오류:', error);
    res.status(500).json({
      success: false,
      error: '만료 예약 정리 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
