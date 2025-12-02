const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const db = require('../config/database');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 시스템 프롬프트 (챗봇 역할 정의)
const SYSTEM_PROMPT = `당신은 아주대학교 도서관의 친절한 AI 도우미입니다.

역할:
- 도서 검색 및 추천을 도와줍니다
- 대출, 반납, 연장 방법을 안내합니다
- 도서관 이용 규칙을 설명합니다
- 친절하고 전문적인 톤으로 답변합니다

도서관 규칙:
- 최대 대출 권수: 5권
- 대출 기간: 14일
- 연장: 최대 2회 (각 14일씩)
- 연체료: 1일당 500원
- 예약: 대출 중인 책만 가능

답변 시:
1. 간결하고 명확하게 답변하세요
2. 필요시 단계별로 설명하세요
3. 이모지를 적절히 사용하세요
4. 도서 추천 시 카테고리와 저자를 언급하세요`;

// 챗봇 대화
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: '메시지를 입력해주세요'
      });
    }

    // 도서 검색 의도 감지
    const isBookQuery = /책|도서|추천|검색|찾|읽/i.test(message);
    
    let contextInfo = '';
    
    // 도서 검색 관련 질문이면 DB에서 정보 가져오기
    if (isBookQuery) {
      try {
        // 인기 도서 가져오기
        const [popularBooks] = await db.query(`
          SELECT b.title, b.author, b.category, COUNT(l.loan_id) as loan_count
          FROM Books b
          LEFT JOIN Loans l ON b.book_id = l.book_id
          GROUP BY b.book_id
          ORDER BY loan_count DESC
          LIMIT 5
        `);

        // 카테고리 목록
        const [categories] = await db.query(`
          SELECT DISTINCT category FROM Books
        `);

        contextInfo = `\n\n[도서관 데이터베이스 정보]
인기 도서 TOP 5:
${popularBooks.map((b, i) => `${i + 1}. ${b.title} - ${b.author} (${b.category})`).join('\n')}

보유 카테고리: ${categories.map(c => c.category).join(', ')}

위 정보를 바탕으로 자연스럽게 답변하세요.`;
      } catch (error) {
        console.error('DB 조회 오류:', error);
      }
    }

    // 대화 히스토리 구성
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + contextInfo },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 더 저렴한 모델
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        response: aiResponse,
        conversationHistory: [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: aiResponse }
        ]
      }
    });

  } catch (error) {
    console.error('챗봇 오류:', error);
    
    // OpenAI API 오류 처리
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        error: 'OpenAI API 키가 유효하지 않습니다'
      });
    }

    res.status(500).json({
      success: false,
      error: '챗봇 응답 중 오류가 발생했습니다'
    });
  }
});

// 대화 초기화
router.post('/reset', (req, res) => {
  res.json({
    success: true,
    message: '대화가 초기화되었습니다'
  });
});

// 빠른 질문 (FAQ)
router.get('/faq', (req, res) => {
  const faqs = [
    {
      question: '📚 책은 어떻게 빌리나요?',
      answer: '1. 원하는 책을 검색하세요\n2. 책 상세 페이지에서 "대출하기" 버튼 클릭\n3. 14일 동안 이용 가능합니다'
    },
    {
      question: '🔄 대출 연장은 어떻게 하나요?',
      answer: '마이페이지 > 대출 현황에서 "연장하기" 버튼을 클릭하세요. 최대 2회까지 가능합니다.'
    },
    {
      question: '💰 연체료는 얼마인가요?',
      answer: '하루당 500원입니다. 반납 시 자동으로 계산됩니다.'
    },
    {
      question: '📖 최대 몇 권까지 빌릴 수 있나요?',
      answer: '한 번에 최대 5권까지 대출 가능합니다.'
    },
    {
      question: '⏰ 대출 기간은 얼마나 되나요?',
      answer: '14일입니다. 연장 시 추가 14일씩 연장됩니다.'
    }
  ];

  res.json({
    success: true,
    data: faqs
  });
});

module.exports = router;
