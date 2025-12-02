const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 회원 목록 조회 (페이지네이션)
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        m.*,
        COUNT(DISTINCT l.loan_id) as total_loans,
        COUNT(DISTINCT CASE WHEN l.return_date IS NULL THEN l.loan_id END) as current_loans,
        SUM(CASE WHEN l.return_date IS NULL AND l.due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_count,
        COUNT(DISTINCT r.reservation_id) as active_reservations
      FROM Members m
      LEFT JOIN Loans l ON m.member_id = l.member_id
      LEFT JOIN Reservations r ON m.member_id = r.member_id AND r.status = 'active'
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (m.name LIKE ? OR m.student_id LIKE ? OR m.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status === 'active') {
      query += ` AND m.status = 'active'`;
    } else if (status === 'suspended') {
      query += ` AND m.status = 'suspended'`;
    }

    query += ` GROUP BY m.member_id ORDER BY m.member_id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [members] = await db.query(query, params);

    // 전체 개수 조회
    let countQuery = 'SELECT COUNT(*) as total FROM Members WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ` AND (name LIKE ? OR student_id LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status === 'active') {
      countQuery += ` AND status = 'active'`;
    } else if (status === 'suspended') {
      countQuery += ` AND status = 'suspended'`;
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countResult[0].total / limit),
          total_items: countResult[0].total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// 회원 상세 정보
router.get('/detail/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    // 회원 기본 정보
    const [member] = await db.query(
      'SELECT * FROM Members WHERE member_id = ?',
      [memberId]
    );

    if (member.length === 0) {
      return res.status(404).json({
        success: false,
        error: '회원을 찾을 수 없습니다'
      });
    }

    // 대출 통계
    const [loanStats] = await db.query(
      `SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN return_date IS NULL THEN 1 ELSE 0 END) as current_loans,
        SUM(CASE WHEN return_date IS NULL AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_loans,
        SUM(overdue_fee) as total_overdue_fee
      FROM Loans
      WHERE member_id = ?`,
      [memberId]
    );

    // 최근 대출 이력
    const [recentLoans] = await db.query(
      `SELECT l.*, b.title, b.author
       FROM Loans l
       JOIN Books b ON l.book_id = b.book_id
       WHERE l.member_id = ?
       ORDER BY l.loan_date DESC
       LIMIT 5`,
      [memberId]
    );

    // 활성 예약
    const [reservations] = await db.query(
      `SELECT r.*, b.title, b.author
       FROM Reservations r
       JOIN Books b ON r.book_id = b.book_id
       WHERE r.member_id = ? AND r.status = 'active'`,
      [memberId]
    );

    res.json({
      success: true,
      data: {
        member: member[0],
        statistics: loanStats[0],
        recent_loans: recentLoans,
        active_reservations: reservations
      }
    });
  } catch (error) {
    console.error('회원 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 정보 조회 중 오류가 발생했습니다'
    });
  }
});

// 회원 정보 수정
router.put('/update/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, email, phone, department, grade } = req.body;

    const [member] = await db.query(
      'SELECT * FROM Members WHERE member_id = ?',
      [memberId]
    );

    if (member.length === 0) {
      return res.status(404).json({
        success: false,
        error: '회원을 찾을 수 없습니다'
      });
    }

    await db.query(
      `UPDATE Members SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        department = COALESCE(?, department),
        grade = COALESCE(?, grade)
      WHERE member_id = ?`,
      [name, email, phone, department, grade, memberId]
    );

    // 관리자 로그
    await db.query(
      `INSERT INTO AdminLogs (admin_id, action_type, action_details, target_type, target_id)
       VALUES (1, 'member_update', ?, 'member', ?)`,
      [`회원 정보 수정: ${member[0].name}`, memberId]
    );

    res.json({
      success: true,
      message: '회원 정보가 수정되었습니다'
    });
  } catch (error) {
    console.error('회원 정보 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 정보 수정 중 오류가 발생했습니다'
    });
  }
});

// 회원 정지/해제
router.put('/suspend/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { action, reason } = req.body; // action: 'suspend' or 'activate'

    if (!action || !['suspend', 'activate'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '올바른 action을 입력해주세요 (suspend/activate)'
      });
    }

    const [member] = await db.query(
      'SELECT * FROM Members WHERE member_id = ?',
      [memberId]
    );

    if (member.length === 0) {
      return res.status(404).json({
        success: false,
        error: '회원을 찾을 수 없습니다'
      });
    }

    const newStatus = action === 'suspend' ? 'suspended' : 'active';

    await db.query(
      'UPDATE Members SET status = ? WHERE member_id = ?',
      [newStatus, memberId]
    );

    // 관리자 로그
    await db.query(
      `INSERT INTO AdminLogs (admin_id, action_type, action_details, target_type, target_id)
       VALUES (1, 'member_status', ?, 'member', ?)`,
      [
        `${action === 'suspend' ? '정지' : '정지 해제'}: ${member[0].name} (사유: ${reason || '없음'})`,
        memberId
      ]
    );

    res.json({
      success: true,
      message: `회원이 ${action === 'suspend' ? '정지' : '활성화'}되었습니다`
    });
  } catch (error) {
    console.error('회원 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 상태 변경 중 오류가 발생했습니다'
    });
  }
});

// 연체자 목록
router.get('/overdue', async (req, res) => {
  try {
    const [overdueMembers] = await db.query(
      `SELECT 
        m.member_id,
        m.name,
        m.student_id,
        m.email,
        m.phone,
        COUNT(l.loan_id) as overdue_count,
        SUM(DATEDIFF(CURDATE(), l.due_date)) as total_overdue_days,
        SUM(DATEDIFF(CURDATE(), l.due_date) * 500) as total_overdue_fee,
        MIN(l.due_date) as earliest_due_date
      FROM Members m
      JOIN Loans l ON m.member_id = l.member_id
      WHERE l.return_date IS NULL AND l.due_date < CURDATE()
      GROUP BY m.member_id
      ORDER BY total_overdue_days DESC`
    );

    res.json({
      success: true,
      data: overdueMembers
    });
  } catch (error) {
    console.error('연체자 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '연체자 조회 중 오류가 발생했습니다'
    });
  }
});

// 회원 통계
router.get('/statistics', async (req, res) => {
  try {
    // 전체 통계
    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total_members,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_members
      FROM Members
    `);

    // 학과별 통계
    const [deptStats] = await db.query(`
      SELECT 
        department,
        COUNT(*) as member_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
      FROM Members
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY member_count DESC
      LIMIT 10
    `);

    // 학년별 통계
    const [gradeStats] = await db.query(`
      SELECT 
        grade,
        COUNT(*) as member_count
      FROM Members
      WHERE grade IS NOT NULL
      GROUP BY grade
      ORDER BY grade
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        by_department: deptStats,
        by_grade: gradeStats
      }
    });
  } catch (error) {
    console.error('회원 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 통계 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
