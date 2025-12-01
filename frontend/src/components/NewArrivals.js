import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookDetail from './BookDetail';
import './NewArrivals.css';

function NewArrivals() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/statistics/new-arrivals?limit=20');
      setBooks(response.data.data || []);
    } catch (error) {
      console.error('신착도서 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">로딩 중...</div>;
  }

  return (
    <div className="new-arrivals-container">
      <div className="page-header">
        <h1>🆕 신착도서</h1>
        <p className="subtitle">최근 입고된 따끈따끈한 신간 도서</p>
      </div>

      <div className="books-grid">
        {books.map((book) => (
          <div key={book.book_id} className="new-book-card">
            <div className="new-badge">NEW</div>
            
            <div className="book-cover">
              <div className="book-icon">📚</div>
            </div>

            <div className="book-content">
              <span className="category-badge">{book.category}</span>
              <h3 className="book-title">{book.title}</h3>
              <p className="book-author">{book.author}</p>
              <p className="book-publisher">{book.publisher}</p>

              <div className="book-meta">
                {book.average_rating && (
                  <div className="rating">
                    ⭐ {book.average_rating}
                    <span className="review-count">({book.review_count})</span>
                  </div>
                )}
                <div className="availability">
                  <span className={`status ${book.available_copies > 0 ? 'available' : 'unavailable'}`}>
                    {book.available_copies > 0 ? '대출 가능' : '대출 중'}
                  </span>
                  <span className="copies">
                    {book.available_copies}/{book.total_copies}권
                  </span>
                </div>
              </div>

              <button 
                className="detail-btn"
                onClick={() => setSelectedBookId(book.book_id)}
              >
                상세보기
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedBookId && (
        <BookDetail 
          bookId={selectedBookId} 
          onClose={() => setSelectedBookId(null)}
        />
      )}
    </div>
  );
}

export default NewArrivals;