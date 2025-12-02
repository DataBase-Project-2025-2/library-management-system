import React, { useState, useEffect } from 'react';
import './ReadingNoteForm.css';

function ReadingNoteForm({ bookInfo, memberId, onClose, onSuccess, existingNote = null }) {
  const [formData, setFormData] = useState({
    rating: existingNote?.rating || 5,
    content: existingNote?.content || '',
    favorite_quote: existingNote?.favorite_quote || '',
    page_number: existingNote?.page_number || existingNote?.key_points || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('필기 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = existingNote 
        ? `http://localhost:3000/api/reading-notes/${existingNote.note_id}`
        : 'http://localhost:3000/api/reading-notes';
      
      const method = existingNote ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: memberId,
          book_id: bookInfo.book_id,
          ...formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(existingNote ? '필기가 수정되었습니다!' : '필기가 저장되었습니다!');
        onSuccess();
        onClose();
      } else {
        setError(data.error || '필기 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('필기 저장 오류:', error);
      setError('필기 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="reading-note-form" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>📝 {existingNote ? '필기 수정' : '필기 작성'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="book-info-section">
          <h3>{bookInfo.title}</h3>
          <p className="book-author">{bookInfo.author}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 별점 */}
          <div className="form-group">
            <label>
              별점 <span className="required">*</span>
            </label>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${formData.rating >= star ? 'filled' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                >
                  ★
                </span>
              ))}
              <span className="rating-text">{formData.rating}점</span>
            </div>
          </div>

          {/* 페이지 번호 */}
          <div className="form-group">
            <label>📖 페이지 번호</label>
            <input
              type="text"
              name="page_number"
              value={formData.page_number}
              onChange={handleChange}
              placeholder="예: p.42, p.100-105, 제3장"
              className="page-input"
            />
            <p className="field-hint">필기한 내용의 페이지를 기록해두면 나중에 찾기 편해요</p>
          </div>

          {/* 독서 노트 */}
          <div className="form-group">
            <label>
              독서 필기 <span className="required">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="책을 읽으면서 메모하고 싶은 내용을 자유롭게 작성하세요...\n\n예시:\n- 중요한 개념이나 이론\n- 이해가 안 되는 부분\n- 나중에 다시 보고 싶은 내용\n- 궁금한 점이나 질문"
              rows="10"
              required
            />
            <div className="char-count">{formData.content.length} / 2000자</div>
          </div>

          {/* 인상 깊은 구절 / 중요 문장 */}
          <div className="form-group">
            <label>📌 중요 문장 / 인용구</label>
            <textarea
              name="favorite_quote"
              value={formData.favorite_quote}
              onChange={handleChange}
              placeholder="책에서 중요하거나 기억하고 싶은 문장을 적어주세요...\n\n예시:\n- 핵심 문장\n- 좋은 표현\n- 암기할 내용"
              rows="4"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? '저장 중...' : existingNote ? '수정하기' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReadingNoteForm;
