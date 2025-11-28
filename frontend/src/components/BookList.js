import React, { useState, useEffect } from 'react';
import { bookAPI } from '../api';
import './BookList.css';

function BookList() {
  const [books, setBooks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookAPI.getAll();
      setBooks(response.data.data);
      setError(null);
    } catch (err) {
      console.error('도서 조회 오류:', err);
      setError('도서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      fetchBooks();
      return;
    }

    try {
      setLoading(true);
      const response = await bookAPI.search(searchKeyword);
      setBooks(response.data.data);
      setError(null);
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(books.map(book => book.category))];

  const filteredBooks = selectedCategory === 'all' 
    ? books 
    : books.filter(book => book.category === selectedCategory);

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="book-list-container">
      <h1>📚 도서 목록</h1>

      {/* 검색 바 */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="도서명, 저자명으로 검색..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">🔍 검색</button>
        <button 
          type="button" 
          onClick={() => {
            setSearchKeyword('');
            fetchBooks();
          }}
          className="reset-button"
        >
          🔄 초기화
        </button>
      </form>

      {/* 카테고리 필터 */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? '전체' : category}
          </button>
        ))}
      </div>

      {/* 도서 목록 */}
      <div className="books-grid">
        {filteredBooks.length === 0 ? (
          <p className="no-books">검색 결과가 없습니다.</p>
        ) : (
          filteredBooks.map(book => (
            <div key={book.book_id} className="book-card">
              <div className="book-header">
                <h3>{book.title}</h3>
                <span className="category-badge">{book.category}</span>
              </div>
              <p className="author">저자: {book.author}</p>
              <p className="publisher">출판사: {book.publisher}</p>
              <p className="isbn">ISBN: {book.isbn}</p>
              
              <div className="book-status">
                <span className={`status ${book.available_copies > 0 ? 'available' : 'unavailable'}`}>
                  {book.available_copies > 0 ? '대출 가능' : '대출 중'}
                </span>
                <span className="copies">
                  {book.available_copies} / {book.total_copies}권
                </span>
              </div>

              <div className="book-actions">
                <button 
                  className="btn-primary"
                  disabled={book.available_copies === 0}
                >
                  {book.available_copies > 0 ? '📖 대출하기' : '📝 예약하기'}
                </button>
                <button className="btn-secondary">상세보기</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="result-count">
        총 {filteredBooks.length}권의 도서
      </div>
    </div>
  );
}

export default BookList;
