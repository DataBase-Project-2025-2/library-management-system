const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 대출 내역 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        l.*,
        m.name as member_name,
        m.student_id,
        b.title as book_title,
        b.author
      FROM Loans l
      JOIN Members m ON l.member_id = m.member_id
      JOIN Books b ON l.book_id = b.book_id
      ORDER BY l.loan_date DESC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('대출 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '대출 내역 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 회원의 대출 내역 조회
router.get('/member/:memberId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        l.*,
        b.title,
        b.author,
        b.isbn
      FROM Loans l
      JOIN Books b ON l.book_id = b.book_id
      WHERE l.member_id = ?
      ORDER BY l.loan_date DESC
    `, [req.params.memberId]);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('회원 대출 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '대출 내역 조회 중 오류가 발생했습니다'
    });
  }
});

// 현재 대출 중인 도서 조회
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        l.*,
        m.name as member_name,
        m.student_id,
        b.title as book_title,
        b.author
      FROM Loans l
      JOIN Members m ON l.member_id = m.member_id
      JOIN Books b ON l.book_id = b.book_id
      WHERE l.status = 'borrowed'
      ORDER BY l.due_date ASC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('대출 중 도서 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '대출 중 도서 조회 중 오류가 발생했습니다'
    });
  }
});

// 연체 도서 조회
router.get('/overdue', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        l.*,
        m.name as member_name,
        m.student_id,
        m.phone,
        b.title as book_title,
        b.author,
        DATEDIFF(CURDATE(), l.due_date) as overdue_days
      FROM Loans l
      JOIN Members m ON l.member_id = m.member_id
      JOIN Books b ON l.book_id = b.book_id
      WHERE l.status = 'overdue' OR (l.status = 'borrowed' AND l.due_date < CURDATE())
      ORDER BY l.due_date ASC
    `);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('연체 도서 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '연체 도서 조회 중 오류가 발생했습니다'
    });
  }
});

// 도서 대출
router.post('/borrow', async (req, res) => {
  const { member_id, book_id } = req.body;
  
  if (!member_id || !book_id) {
    return res.status(400).json({
      success: false,
      error: '회원 ID와 도서 ID를 모두 입력해주세요'
    });
  }
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. 도서 재고 확인
    const [books] = await connection.query(
      'SELECT available_copies FROM Books WHERE book_id = ?',
      [book_id]
    );
    
    if (books.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: '도서를 찾을 수 없습니다'
      });
    }
    
    if (books[0].available_copies <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: '대출 가능한 도서가 없습니다'
      });
    }
    
    // 2. 회원의 현재 대출 중인 도서 확인
    const [activeLoans] = await connection.query(
      'SELECT COUNT(*) as count FROM Loans WHERE member_id = ? AND status = "borrowed"',
      [member_id]
    );
    
    if (activeLoans[0].count >= 5) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: '최대 대출 권수(5권)를 초과했습니다'
      });
    }
    
    // 3. 대출 기록 생성 (대출 기간 14일)
    const loan_date = new Date();
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 14);
    
    const [result] = await connection.query(
      'INSERT INTO Loans (member_id, book_id, loan_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [member_id, book_id, loan_date, due_date, 'borrowed']
    );
    
    // 4. 도서 재고 감소 (트리거가 자동으로 처리하지만 명시적으로 실행)
    await connection.query(
      'UPDATE Books SET available_copies = available_copies - 1 WHERE book_id = ?',
      [book_id]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: '도서 대출이 완료되었습니다',
      data: {
        loan_id: result.insertId,
        loan_date,
        due_date
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('도서 대출 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 대출 중 오류가 발생했습니다'
    });
  } finally {
    connection.release();
  }
});

// 도서 반납
router.post('/return/:loanId', async (req, res) => {
  const { loanId } = req.params;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. 대출 정보 조회
    const [loans] = await connection.query(
      'SELECT * FROM Loans WHERE loan_id = ?',
      [loanId]
    );
    
    if (loans.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: '대출 기록을 찾을 수 없습니다'
      });
    }
    
    const loan = loans[0];
    
    if (loan.status === 'returned') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: '이미 반납된 도서입니다'
      });
    }
    
    // 2. 연체료 계산
    const return_date = new Date();
    const due_date = new Date(loan.due_date);
    let fine_amount = 0;
    
    if (return_date > due_date) {
      const overdue_days = Math.floor((return_date - due_date) / (1000 * 60 * 60 * 24));
      fine_amount = overdue_days * 500; // 하루당 500원
    }
    
    // 3. 대출 기록 업데이트
    await connection.query(
      'UPDATE Loans SET return_date = ?, status = ?, fine_amount = ? WHERE loan_id = ?',
      [return_date, 'returned', fine_amount, loanId]
    );
    
    // 4. 도서 재고 증가
    await connection.query(
      'UPDATE Books SET available_copies = available_copies + 1 WHERE book_id = ?',
      [loan.book_id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: fine_amount > 0 
        ? `도서 반납이 완료되었습니다. 연체료: ${fine_amount}원`
        : '도서 반납이 완료되었습니다',
      data: {
        return_date,
        fine_amount,
        overdue_days: fine_amount > 0 ? Math.floor(fine_amount / 500) : 0
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('도서 반납 오류:', error);
    res.status(500).json({
      success: false,
      error: '도서 반납 중 오류가 발생했습니다'
    });
  } finally {
    connection.release();
  }
});

// 대출 연장
router.post('/renew/:loanId', async (req, res) => {
  const { loanId } = req.params;
  
  try {
    // 1. 대출 정보 조회
    const [loans] = await db.query(
      'SELECT * FROM Loans WHERE loan_id = ?',
      [loanId]
    );
    
    if (loans.length === 0) {
      return res.status(404).json({
        success: false,
        error: '대출 기록을 찾을 수 없습니다'
      });
    }
    
    const loan = loans[0];
    
    if (loan.status !== 'borrowed') {
      return res.status(400).json({
        success: false,
        error: '대출 중인 도서만 연장할 수 있습니다'
      });
    }
    
    if (loan.renewal_count >= 2) {
      return res.status(400).json({
        success: false,
        error: '최대 연장 횟수(2회)를 초과했습니다'
      });
    }
    
    // 2. 연장 (14일 추가)
    const new_due_date = new Date(loan.due_date);
    new_due_date.setDate(new_due_date.getDate() + 14);
    
    await db.query(
      'UPDATE Loans SET due_date = ?, renewal_count = renewal_count + 1 WHERE loan_id = ?',
      [new_due_date, loanId]
    );
    
    res.json({
      success: true,
      message: '대출이 연장되었습니다',
      data: {
        new_due_date,
        renewal_count: loan.renewal_count + 1
      }
    });
    
  } catch (error) {
    console.error('대출 연장 오류:', error);
    res.status(500).json({
      success: false,
      error: '대출 연장 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
