const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 좌석 현황 조회 (구역별)
router.get('/zones', async (req, res) => {
  try {
    const [zones] = await db.query(`
      SELECT 
        zone,
        COUNT(*) as total_seats,
        SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) as available_seats,
        CASE 
          WHEN zone = '멀티미디어실' THEN 'pc'
          ELSE 'general'
        END as type
      FROM Seats
      GROUP BY zone
      ORDER BY 
        CASE zone
          WHEN '2층 커뮤니티 라운지' THEN 1
          WHEN '3층 열람실' THEN 2
          WHEN '4층 스터디 라운지' THEN 3
          WHEN '멀티미디어실' THEN 4
        END
    `);
    
    res.json({
      success: true,
      data: zones
    });
  } catch (error) {
    console.error('좌석 현황 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '좌석 현황 조회 중 오류가 발생했습니다'
    });
  }
});

// 특정 구역의 좌석 목록 조회
router.get('/zone/:zoneName', async (req, res) => {
  try {
    const { zoneName } = req.params;
    
    const [seats] = await db.query(`
      SELECT 
        s.seat_id,
        s.zone,
        s.seat_number,
        s.seat_type,
        s.is_available,
        CASE 
          WHEN sr.reservation_id IS NOT NULL 
            AND sr.status = 'active' 
            AND sr.start_time <= NOW() 
            AND sr.end_time > NOW() 
          THEN TRUE 
          ELSE FALSE 
        END as is_reserved,
        sr.member_id as reserved_by,
        sr.start_time,
        sr.end_time
      FROM Seats s
      LEFT JOIN SeatReservations sr ON s.seat_id = sr.seat_id 
        AND sr.status = 'active'
        AND sr.start_time <= NOW()
        AND sr.end_time > NOW()
      WHERE s.zone = ?
      ORDER BY s.seat_number
    `, [zoneName]);
    
    res.json({
      success: true,
      data: seats
    });
  } catch (error) {
    console.error('좌석 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '좌석 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// 좌석 예약하기
router.post('/reserve', async (req, res) => {
  try {
    const { seat_id, member_id, duration_hours } = req.body;
    
    if (!seat_id || !member_id || !duration_hours) {
      return res.status(400).json({
        success: false,
        error: '좌석 ID, 회원 ID, 사용 시간은 필수입니다'
      });
    }
    
    // 사용 시간 제한 (1~4시간)
    if (duration_hours < 1 || duration_hours > 4) {
      return res.status(400).json({
        success: false,
        error: '사용 시간은 1~4시간 사이로 선택해주세요'
      });
    }
    
    // 좌석 정보 확인
    const [seats] = await db.query('SELECT * FROM Seats WHERE seat_id = ?', [seat_id]);
    if (seats.length === 0) {
      return res.status(404).json({
        success: false,
        error: '존재하지 않는 좌석입니다'
      });
    }
    
    const seat = seats[0];
    
    if (!seat.is_available) {
      return res.status(400).json({
        success: false,
        error: '사용 불가능한 좌석입니다'
      });
    }
    
    const now = new Date();
    const endTime = new Date(now.getTime() + duration_hours * 60 * 60 * 1000);
    
    // 해당 좌석의 시간대 중복 확인
    const [conflicts] = await db.query(`
      SELECT * FROM SeatReservations
      WHERE seat_id = ?
      AND status = 'active'
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `, [seat_id, now, now, endTime, endTime, now, endTime]);
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        error: '해당 시간대에 이미 예약된 좌석입니다'
      });
    }
    
    // 사용자의 활성 예약 확인 (중복 예약 방지)
    const [activeReservations] = await db.query(`
      SELECT * FROM SeatReservations
      WHERE member_id = ?
      AND status = 'active'
      AND end_time > NOW()
    `, [member_id]);
    
    if (activeReservations.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 예약된 좌석이 있습니다. 하나의 좌석만 예약 가능합니다.'
      });
    }
    
    // 예약 생성
    const [result] = await db.query(`
      INSERT INTO SeatReservations (seat_id, member_id, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `, [seat_id, member_id, now, endTime]);
    
    res.json({
      success: true,
      message: '좌석이 예약되었습니다',
      data: {
        reservation_id: result.insertId,
        seat_id: seat_id,
        zone: seat.zone,
        seat_number: seat.seat_number,
        start_time: now,
        end_time: endTime,
        duration_hours: duration_hours
      }
    });
    
  } catch (error) {
    console.error('좌석 예약 오류:', error);
    res.status(500).json({
      success: false,
      error: '좌석 예약 중 오류가 발생했습니다'
    });
  }
});

// 내 좌석 예약 조회
router.get('/my-reservations/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const [reservations] = await db.query(`
      SELECT 
        sr.*,
        s.zone,
        s.seat_number,
        s.seat_type,
        m.name as member_name,
        m.student_id
      FROM SeatReservations sr
      JOIN Seats s ON sr.seat_id = s.seat_id
      JOIN Members m ON sr.member_id = m.member_id
      WHERE sr.member_id = ?
      ORDER BY sr.created_at DESC
      LIMIT 50
    `, [memberId]);
    
    res.json({
      success: true,
      data: reservations
    });
    
  } catch (error) {
    console.error('예약 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 조회 중 오류가 발생했습니다'
    });
  }
});

// 예약 취소
router.delete('/cancel/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    // 예약 확인
    const [reservations] = await db.query(`
      SELECT * FROM SeatReservations WHERE reservation_id = ?
    `, [reservationId]);
    
    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        error: '존재하지 않는 예약입니다'
      });
    }
    
    const reservation = reservations[0];
    
    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: '취소할 수 없는 예약입니다'
      });
    }
    
    // 예약 취소
    await db.query(`
      UPDATE SeatReservations
      SET status = 'cancelled'
      WHERE reservation_id = ?
    `, [reservationId]);
    
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

// 체크인
router.post('/checkin/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    // 예약 확인
    const [reservations] = await db.query(`
      SELECT * FROM SeatReservations WHERE reservation_id = ?
    `, [reservationId]);
    
    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        error: '존재하지 않는 예약입니다'
      });
    }
    
    const reservation = reservations[0];
    
    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: '체크인할 수 없는 예약입니다'
      });
    }
    
    if (reservation.checked_in) {
      return res.status(400).json({
        success: false,
        error: '이미 체크인된 예약입니다'
      });
    }
    
    const now = new Date();
    
    // 시작 시간 10분 전부터 체크인 가능
    const allowedCheckinTime = new Date(reservation.start_time.getTime() - 10 * 60 * 1000);
    
    if (now < allowedCheckinTime) {
      return res.status(400).json({
        success: false,
        error: '체크인은 예약 시작 10분 전부터 가능합니다'
      });
    }
    
    // 체크인
    await db.query(`
      UPDATE SeatReservations
      SET checked_in = TRUE, checked_in_time = NOW()
      WHERE reservation_id = ?
    `, [reservationId]);
    
    res.json({
      success: true,
      message: '체크인이 완료되었습니다'
    });
    
  } catch (error) {
    console.error('체크인 오류:', error);
    res.status(500).json({
      success: false,
      error: '체크인 중 오류가 발생했습니다'
    });
  }
});

// 좌석 통계
router.get('/statistics', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_seats,
        SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) as available_seats,
        (SELECT COUNT(*) FROM SeatReservations WHERE status = 'active' AND end_time > NOW()) as active_reservations,
        (SELECT COUNT(DISTINCT member_id) FROM SeatReservations WHERE status = 'active' AND end_time > NOW()) as active_users
      FROM Seats
    `);
    
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