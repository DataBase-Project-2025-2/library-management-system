const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { student_id, password } = req.body;

    const [members] = await db.query(
      'SELECT * FROM Members WHERE student_id = ? AND status = "active"',
      [student_id]
    );

    if (members.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '학번 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    const member = members[0];

    // 관리자 계정 확인
    if (student_id === 'admin') {
      if (password !== 'rhksflwk0810') {
        return res.status(401).json({ 
          success: false, 
          message: '학번 또는 비밀번호가 올바르지 않습니다.' 
        });
      }
    } else {
      // 일반 사용자 비밀번호: 1234
      if (password !== '1234') {
        return res.status(401).json({ 
          success: false, 
          message: '학번 또는 비밀번호가 올바르지 않습니다.' 
        });
      }
    }

    delete member.password_hash;

    // 관리자 여부 추가
    const isAdmin = student_id === 'admin';

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        member: { ...member, isAdmin },
        token: `temp_token_${member.member_id}`
      }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
