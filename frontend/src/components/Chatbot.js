import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '안녕하세요! 👋 아주대학교 도서관 AI 도우미입니다.\n\n무엇을 도와드릴까요?\n- 도서 추천\n- 대출 방법 안내\n- 도서관 이용 규칙'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/chatbot/chat', {
        message: userMessage,
        conversationHistory: conversationHistory
      });

      if (response.data.success) {
        // AI 응답 추가
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: response.data.data.response }
        ]);
        setConversationHistory(response.data.data.conversationHistory);
      }
    } catch (error) {
      console.error('챗봇 오류:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송합니다. 일시적인 오류가 발생했습니다. 😥\n잠시 후 다시 시도해주세요.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question, answer) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: answer }
    ]);
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: '대화가 초기화되었습니다. 😊\n새로운 질문을 해주세요!'
      }
    ]);
    setConversationHistory([]);
  };

  const quickQuestions = [
    { q: '📚 책 추천해줘', a: null },
    { q: '🔄 대출 연장 방법', a: null },
    { q: '💰 연체료 확인', a: null }
  ];

  return (
    <>
      {/* 챗봇 버튼 */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="챗봇 열기"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* 챗봇 창 */}
      {isOpen && (
        <div className="chatbot-container">
          {/* 헤더 */}
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-icon">🤖</span>
              <div>
                <h3>AI 도서관 도우미</h3>
                <p className="chatbot-status">● 온라인</p>
              </div>
            </div>
            <button
              className="chatbot-reset"
              onClick={handleReset}
              title="대화 초기화"
            >
              🔄
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-content">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                {msg.role === 'user' && (
                  <div className="message-avatar user-avatar">👤</div>
                )}
              </div>
            ))}
            {loading && (
              <div className="message bot-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 빠른 질문 */}
          {messages.length <= 1 && (
            <div className="quick-questions">
              {quickQuestions.map((item, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => {
                    setInput(item.q);
                  }}
                >
                  {item.q}
                </button>
              ))}
            </div>
          )}

          {/* 입력 영역 */}
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력하세요..."
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="send-btn"
            >
              {loading ? '...' : '📤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
