import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookDetail from './BookDetail';
import './PopularBooks.css';

function PopularBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    fetchPopularBooks();
  }, []);

  const fetchPopularBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/statistics/popular-books?limit=20');
      setBooks(response.data.data || []);
    } catch (error) {
      console.error('인기도서 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">로딩 중...</div>;
  }

  return (
    <div className="popular-books-container">
      <div className="page-header">
        <h1>🔥 인기도서 TOP 20</h1>
        <p className="subtitle">대출 횟수 기준 인기 도서 순위</p>
      </div>

      <div className="ranking-list">
        {books.map((book, index) => (
          <div key={book.book_id} className="ranking-card">
            <div className="rank-badge">
              <span className={`rank ${index < 3 ? 'top' : ''}`}>
                {index + 1}
              </span>
            </div>

            <div className="book-info">
              <h3 className="book-title">{book.title}</h3>
              <p className="book-author">저자: {book.author}</p>
              <div className="book-meta">
                <span className="category-tag">{book.category}</span>
                <span className="isbn">ISBN: {book.isbn}</span>
              </div>
            </div>

            <div className="book-stats">
              <div className="stat-item">
                <div className="stat-value">📖 {book.loan_count}</div>
                <div className="stat-label">대출</div>
              </div>
              {book.average_rating && (
                <div className="stat-item">
                  <div className="stat-value">⭐ {parseFloat(book.average_rating).toFixed(1)}</div>
                  <div className="stat-label">평점</div>
                </div>
              )}
              <div className="stat-item">
                <div className="stat-value">💬 {book.review_count}</div>
                <div className="stat-label">서평</div>
              </div>
            </div>

            <button 
              className="view-detail-btn"
              onClick={() => setSelectedBookId(book.book_id)}
            >
              상세보기
            </button>
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

export default PopularBooks;