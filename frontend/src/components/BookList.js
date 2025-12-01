import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { bookAPI } from '../api';
import BookDetail from './BookDetail';
import './BookList.css';

function BookList() {
  const [books, setBooks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [borrowing, setBorrowing] = useState(null);
  const [reserving, setReserving] = useState(null);

  useEffect(() => {
    // localStorage에서 검색어 가져오기
    const savedQuery = localStorage.getItem('searchQuery');
    console.log('📌 저장된 검색어:', savedQuery);
    
    if (savedQuery) {
      setSearchKeyword(savedQuery);
      localStorage.removeItem('searchQuery');
      console.log('🔍 검색 자동 실행:', savedQuery);
      // 검색 자동 실행
      performSearch(savedQuery);
    } else {
      // 검색어 없으면 전체 목록 로드
      fetchBooks();
    }
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

  const handleBorrow = async (book) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (window.confirm(`"${book.title}"를 대출하시겠습니까?`)) {
      setBorrowing(book.book_id);
      try {
        const response = await axios.post('http://localhost:3000/api/loans/borrow', {
          member_id: user.member_id,
          book_id: book.book_id
        });

        if (response.data.success) {
          alert(`대출이 완료되었습니다!\n반납 예정일: ${new Date(response.data.data.due_date).toLocaleDateString()}`);
          fetchBooks();
        }
      } catch (error) {
        alert(error.response?.data?.error || '대출에 실패했습니다.');
      } finally {
        setBorrowing(null);
      }
    }
  };

  const handleReserve = async (book) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (window.confirm(`"${book.title}"를 예약하시겠습니까?`)) {
      setReserving(book.book_id);
      try {
        const response = await axios.post('http://localhost:3000/api/reservations/create', {
          member_id: user.member_id,
          book_id: book.book_id
        });

        if (response.data.success) {
          alert(`예약이 완료되었습니다!\n만료일: ${new Date(response.data.data.expiry_date).toLocaleDateString()}`);
          fetchBooks();
        }
      } catch (error) {
        alert(error.response?.data?.error || '예약에 실패했습니다.');
      } finally {
        setReserving(null);
      }
    }
  };

  const performSearch = async (query) => {
    console.log('🔍 performSearch 호출됨, 검색어:', query);
    try {
      setLoading(true);
      console.log('📡 API 호출 중:', `/books/search/${query}`);
      const response = await bookAPI.search(query);
      console.log('✅ API 응답:', response.data);
      setBooks(response.data.data);
      setError(null);
    } catch (err) {
      console.error('❌ 검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
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
    performSearch(searchKeyword);
  };

  const categories = ['all', '프로그래밍', 'AI', '데이터베이스', '보안', '소프트웨어공학', '네트워크', '인프라', 'DevOps', '클라우드', '컨테이너', '아키텍처'];

  const filteredBooks = selectedCategory === 'all' 
    ? books 
    : books.filter(book => book.category === selectedCategory);

  if (loading && books.length === 0) {
    return <div className="loading-container">로딩 중...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
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
                {book.available_copies > 0 ? (
                  <button 
                    className="btn-primary"
                    disabled={borrowing === book.book_id}
                    onClick={() => handleBorrow(book)}
                  >
                    {borrowing === book.book_id ? '대출 중...' : '📖 대출하기'}
                  </button>
                ) : (
                  <button 
                    className="btn-primary"
                    disabled={reserving === book.book_id}
                    onClick={() => handleReserve(book)}
                  >
                    {reserving === book.book_id ? '예약 중...' : '📝 예약하기'}
                  </button>
                )}
                <button 
                  className="btn-secondary"
                  onClick={() => setSelectedBookId(book.book_id)}
                >
                  상세보기
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="result-count">
        총 {filteredBooks.length}권의 도서
      </div>

      {/* 도서 상세 모달 */}
      {selectedBookId && (
        <BookDetail 
          bookId={selectedBookId} 
          onClose={() => setSelectedBookId(null)}
        />
      )}
    </div>
  );
}

export default BookList;