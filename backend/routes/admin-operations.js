const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 전체 대출 현황 (관리자용)
router.get('/loans/all', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        l.*,
        m.name as member_name,
        m.student_id,
        m.phone,
        b.title,
        b.author,
        CASE 
          WHEN l.return_date IS NOT NULL THEN 'returned'
          WHEN l.due_date < CURDATE() THEN 'overdue'
          ELSE 'active'
        END as loan_status,
        CASE 
          WHEN l.return_date IS NULL AND l.due_date < CURDATE() 
          THEN DATEDIFF(CURDATE(), l.due_date) * 500
          ELSE 0
        END as calculated_fee
      FROM Loans l
      JOIN Members m ON l.member_id = m.member_id
      JOIN Books b ON l.book_id = b.book_id
      WHERE 1=1
    `;

    const params = [];

    if (status === 'active') {
      query += ` AND l.return_date IS NULL AND l.due_date >= CURDATE()`;
    } else if (status === 'overdue') {
      query += ` AND l.return_date IS NULL AND l.due_date < CURDATE()`;
    } else if (status === 'returned') {
      query += ` AND l.return_date IS NOT NULL`;
    }

    query += ` ORDER BY l.loan_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [loans] = await db.query(query, params);

    // 전체 개수
    let countQuery = 'SELECT COUNT(*) as total FROM Loans WHERE 1=1';
    if (status === 'active') {
      countQuery += ` AND return_date IS NULL AND due_date >= CURDATE()`;
    } else if (status === 'overdue') {
      countQuery += ` AND return_date IS NULL AND due_date < CURDATE()`;
    } else if (status === 'returned') {
      countQuery += ` AND return_date IS NOT NULL`;
    }

    const [countResult] = await db.query(countQuery);

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countResult[0].total / limit),
          total_items: countResult[0].total
        }
      }
    });
  } catch (error) {
    console.error('대출 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '대출 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// 강제 반납 처리
router.post('/loans/force-return/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;

    const [loan] = await db.query(
      `SELECT l.*, b.title, m.name as member_name
       FROM Loans l
       JOIN Books b ON l.book_id = b.book_id
       JOIN Members m ON l.member_id = m.member_id
       WHERE l.loan_id = ?`,
      [loanId]
    );

    if (loan.length === 0) {
      return res.status(404).json({
        success: false,
        error: '대출 기록을 찾을 수 없습니다'
      });
    }

    if (loan[0].return_date) {
      return res.status(400).json({
        success: false,
        error: '이미 반납된 도서입니다'
      });
    }

    // 연체료 계산
    const dueDate = new Date(loan[0].due_date);
    const returnDate = new Date();
    const overdueDays = Math.max(0, Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24)));
    const overdueFee = overdueDays * 500;

    // 반납 처리
    await db.query(
      `UPDATE Loans 
       SET return_date = CURDATE(), 
           overdue_fee = ?
       WHERE loan_id = ?`,
      [overdueFee, loanId]
    );

    // 재고 복원
    await db.query(
      'UPDATE Books SET available_copies = available_copies + 1 WHERE book_id = ?',
      [loan[0].book_id]
    );

    // 관리자 로그
    await db.query(
      `INSERT INTO AdminLogs (admin_id, action_type, action_details, target_type, target_id)
       VALUES (1, 'force_return', ?, 'loan', ?)`,
      [
        `강제 반납: ${loan[0].title} (회원: ${loan[0].member_name}, 사유: ${reason || '없음'}, 연체료: ${overdueFee}원)`,
        loanId
      ]
    );

    res.json({
      success: true,
      message: '강제 반납 처리되었습니다',
      data: {
        overdue_days: overdueDays,
        overdue_fee: overdueFee
      }
    });
  } catch (error) {
    console.error('강제 반납 오류:', error);
    res.status(500).json({
      success: false,
      error: '강제 반납 처리 중 오류가 발생했습니다'
    });
  }
});

// 대출 통계
router.get('/statistics/loans', async (req, res) => {
  try {
    const { period = '30' } = req.query; // 기간: 7, 30, 90, 365일

    // 전체 통계
    const [overview] = await db.query(`
      SELECT
        COUNT(*) as total_loans,
        COUNT(CASE WHEN return_date IS NULL THEN 1 END) as active_loans,
        COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as returned_loans,
        COUNT(CASE WHEN return_date IS NULL AND due_date < CURDATE() THEN 1 END) as overdue_loans,
        SUM(CASE WHEN return_date IS NULL AND due_date < CURDATE() 
            THEN DATEDIFF(CURDATE(), due_date) * 500 ELSE 0 END) as total_overdue_fee
      FROM Loans
    `);

    // 기간별 대출 추이
    const [trend] = await db.query(
      `SELECT 
        DATE(loan_date) as date,
        COUNT(*) as loan_count
      FROM Loans
      WHERE loan_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(loan_date)
      ORDER BY date`,
      [parseInt(period)]
    );

    // 카테고리별 대출
    const [byCategory] = await db.query(`
      SELECT 
        b.category,
        COUNT(l.loan_id) as loan_count
      FROM Loans l
      JOIN Books b ON l.book_id = b.book_id
      WHERE l.loan_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY b.category
      ORDER BY loan_count DESC
    `, [parseInt(period)]);

    // 인기 도서 TOP 10
    const [popularBooks] = await db.query(
      `SELECT 
        b.book_id,
        b.title,
        b.author,
        b.category,
        COUNT(l.loan_id) as loan_count
      FROM Books b
      JOIN Loans l ON b.book_id = l.book_id
      WHERE l.loan_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY b.book_id
      ORDER BY loan_count DESC
      LIMIT 10`,
      [parseInt(period)]
    );

    // 활발한 회원 TOP 10
    const [activeMembers] = await db.query(
      `SELECT 
        m.member_id,
        m.name,
        m.student_id,
        m.department,
        COUNT(l.loan_id) as loan_count
      FROM Members m
      JOIN Loans l ON m.member_id = l.member_id
      WHERE l.loan_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY m.member_id
      ORDER BY loan_count DESC
      LIMIT 10`,
      [parseInt(period)]
    );

    res.json({
      success: true,
      data: {
        overview: overview[0],
        trend,
        by_category: byCategory,
        popular_books: popularBooks,
        active_members: activeMembers
      }
    });
  } catch (error) {
    console.error('대출 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다'
    });
  }
});

// 예약 관리
router.get('/reservations', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        r.*,
        m.name as member_name,
        m.student_id,
        m.phone,
        b.title,
        b.author,
        b.available_copies
      FROM Reservations r
      JOIN Members m ON r.member_id = m.member_id
      JOIN Books b ON r.book_id = b.book_id
      WHERE 1=1
    `;

    if (status) {
      query += ` AND r.status = ?`;
    }

    query += ` ORDER BY r.reservation_date DESC`;

    const [reservations] = await db.query(
      query,
      status ? [status] : []
    );

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('예약 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// 예약 취소 (관리자)
router.delete('/reservations/cancel/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { reason } = req.body;

    const [reservation] = await db.query(
      `SELECT r.*, b.title, m.name as member_name
       FROM Reservations r
       JOIN Books b ON r.book_id = b.book_id
       JOIN Members m ON r.member_id = m.member_id
       WHERE r.reservation_id = ?`,
      [reservationId]
    );

    if (reservation.length === 0) {
      return res.status(404).json({
        success: false,
        error: '예약을 찾을 수 없습니다'
      });
    }

    await db.query(
      'UPDATE Reservations SET status = ? WHERE reservation_id = ?',
      ['cancelled', reservationId]
    );

    // 관리자 로그
    await db.query(
      `INSERT INTO AdminLogs (admin_id, action_type, action_details, target_type, target_id)
       VALUES (1, 'reservation_cancel', ?, 'reservation', ?)`,
      [
        `예약 취소: ${reservation[0].title} (회원: ${reservation[0].member_name}, 사유: ${reason || '없음'})`,
        reservationId
      ]
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

// 관리자 활동 로그
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [logs] = await db.query(
      `SELECT * FROM AdminLogs
       ORDER BY action_timestamp DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM AdminLogs'
    );

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countResult[0].total / limit),
          total_items: countResult[0].total
        }
      }
    });
  } catch (error) {
    console.error('관리자 로그 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
