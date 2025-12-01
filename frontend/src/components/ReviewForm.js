import React, { useState } from 'react';
import axios from 'axios';
import './ReviewForm.css';

function ReviewForm({ bookId, bookTitle, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (!comment.trim()) {
      alert('서평 내용을 입력해주세요.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3000/api/reviews', {
        member_id: user.member_id,
        book_id: bookId,
        rating: rating,
        comment: comment.trim()
      });

      if (response.data.success) {
        alert('서평이 작성되었습니다!');
        if (onSubmit) onSubmit();
        onClose();
      }
    } catch (error) {
      alert(error.response?.data?.error || '서평 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form-overlay" onClick={onClose}>
      <div className="review-form-container" onClick={e => e.stopPropagation()}>
        <button className="close-btn-top" onClick={onClose}>✕</button>
        
        <h2>📝 서평 작성</h2>
        <p className="book-title">{bookTitle}</p>

        <form onSubmit={handleSubmit}>
          <div className="rating-section">
            <label>별점</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
              <span className="rating-text">
                {rating > 0 ? `${rating}점` : '별점을 선택하세요'}
              </span>
            </div>
          </div>

          <div className="comment-section">
            <label>서평</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="이 책에 대한 감상을 작성해주세요..."
              rows="6"
              maxLength="500"
            />
            <div className="char-count">{comment.length}/500</div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              취소
            </button>
            <button type="submit" disabled={submitting} className="btn-submit">
              {submitting ? '작성 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewForm;