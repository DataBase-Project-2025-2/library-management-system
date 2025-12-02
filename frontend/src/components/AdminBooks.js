import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminBooks.css';

function AdminBooks({ onUpdate }) {
  const [books, setBooks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    publisher: '',
    publication_year: '',
    isbn: '',
    category: '',
    total_copies: 1,
    location: '1층 종합자료실'
  });

  const categories = ['소설', '시/에세이', '인문', '역사', '예술', '종교', '사회과학', '자연과학', '기술과학', '언어', '문학'];

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/books/search', {
        params: {
          keyword: searchKeyword,
          category: selectedCategory
        }
      });
      setBooks(response.data.data);
    } catch (error) {
      console.error('도서 조회 오류:', error);
    }
  };

  const handleSearch = () => {
    fetchBooks();
  };

  const handleAddBook = async () => {
    try {
      await axios.post('http://localhost:3000/api/admin/books/add', newBook);
      alert('도서가 추가되었습니다!');
      setShowAddModal(false);
      setNewBook({
        title: '',
        author: '',
        publisher: '',
        publication_year: '',
        isbn: '',
        category: '',
        total_copies: 1,
        location: '1층 종합자료실'
      });
      fetchBooks();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(error.response?.data?.error || '도서 추가 실패');
    }
  };

  const handleEditBook = async () => {
    try {
      await axios.put(`http://localhost:3000/api/admin/books/update/${selectedBook.book_id}`, selectedBook);
      alert('도서 정보가 수정되었습니다!');
      setShowEditModal(false);
      setSelectedBook(null);
      fetchBooks();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(error.response?.data?.error || '도서 수정 실패');
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`"${title}" 도서를 삭제하시겠습니까?`)) return;

    try {
      await axios.delete(`http://localhost:3000/api/admin/books/delete/${bookId}`);
      alert('도서가 삭제되었습니다!');
      fetchBooks();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(error.response?.data?.error || '도서 삭제 실패');
    }
  };

  const handleAdjustStock = async (bookId, adjustment) => {
    const reason = prompt('재고 조정 사유를 입력하세요:');
    if (!reason) return;

    try {
      await axios.put(`http://localhost:3000/api/admin/books/adjust-stock/${bookId}`, {
        adjustment: parseInt(adjustment),
        reason
      });
      alert('재고가 조정되었습니다!');
      fetchBooks();
    } catch (error) {
      alert(error.response?.data?.error || '재고 조정 실패');
    }
  };

  return (
    <div className="admin-books">
      {/* 검색 및 필터 */}
      <div className="admin-books-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="도서명, 저자명, ISBN 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">전체 카테고리</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="btn-search">🔍 검색</button>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-add">
          ➕ 도서 추가
        </button>
      </div>

      {/* 도서 목록 */}
      <div className="books-table-container">
        <table className="books-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>제목</th>
              <th>저자</th>
              <th>카테고리</th>
              <th>ISBN</th>
              <th>재고</th>
              <th>대출</th>
              <th>예약</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.book_id}>
                <td>{book.book_id}</td>
                <td className="book-title">{book.title}</td>
                <td>{book.author}</td>
                <td><span className="category-badge">{book.category}</span></td>
                <td className="isbn">{book.isbn || '-'}</td>
                <td>
                  <div className="stock-info">
                    <span className={book.available_copies > 0 ? 'available' : 'unavailable'}>
                      {book.available_copies}/{book.total_copies}
                    </span>
                    <div className="stock-actions">
                      <button
                        onClick={() => handleAdjustStock(book.book_id, 1)}
                        className="btn-stock-adjust"
                        title="재고 +1"
                      >
                        ➕
                      </button>
                      <button
                        onClick={() => handleAdjustStock(book.book_id, -1)}
                        className="btn-stock-adjust"
                        title="재고 -1"
                      >
                        ➖
                      </button>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={book.current_loans > 0 ? 'badge-warning' : 'badge-info'}>
                    {book.current_loans}건
                  </span>
                </td>
                <td>
                  <span className="badge-info">{book.active_reservations}건</span>
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() => {
                      setSelectedBook(book);
                      setShowEditModal(true);
                    }}
                    className="btn-edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.book_id, book.title)}
                    className="btn-delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {books.length === 0 && (
          <div className="no-results">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* 도서 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📚 새 도서 추가</h2>
            <div className="form-group">
              <label>제목 *</label>
              <input
                type="text"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                placeholder="도서 제목"
              />
            </div>
            <div className="form-group">
              <label>저자 *</label>
              <input
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                placeholder="저자명"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>출판사</label>
                <input
                  type="text"
                  value={newBook.publisher}
                  onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                  placeholder="출판사"
                />
              </div>
              <div className="form-group">
                <label>출판년도</label>
                <input
                  type="number"
                  value={newBook.publication_year}
                  onChange={(e) => setNewBook({ ...newBook, publication_year: e.target.value })}
                  placeholder="2024"
                />
              </div>
            </div>
            <div className="form-group">
              <label>ISBN</label>
              <input
                type="text"
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                placeholder="978-XXXXXXXXXX"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>카테고리 *</label>
                <select
                  value={newBook.category}
                  onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                >
                  <option value="">선택하세요</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>수량</label>
                <input
                  type="number"
                  value={newBook.total_copies}
                  onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })}
                  min="1"
                />
              </div>
            </div>
            <div className="form-group">
              <label>위치</label>
              <input
                type="text"
                value={newBook.location}
                onChange={(e) => setNewBook({ ...newBook, location: e.target.value })}
                placeholder="1층 종합자료실"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)} className="btn-cancel">
                취소
              </button>
              <button onClick={handleAddBook} className="btn-submit">
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 도서 수정 모달 */}
      {showEditModal && selectedBook && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ 도서 정보 수정</h2>
            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                value={selectedBook.title}
                onChange={(e) => setSelectedBook({ ...selectedBook, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>저자</label>
              <input
                type="text"
                value={selectedBook.author}
                onChange={(e) => setSelectedBook({ ...selectedBook, author: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>출판사</label>
                <input
                  type="text"
                  value={selectedBook.publisher || ''}
                  onChange={(e) => setSelectedBook({ ...selectedBook, publisher: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>출판년도</label>
                <input
                  type="number"
                  value={selectedBook.publication_year || ''}
                  onChange={(e) => setSelectedBook({ ...selectedBook, publication_year: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>ISBN</label>
              <input
                type="text"
                value={selectedBook.isbn || ''}
                onChange={(e) => setSelectedBook({ ...selectedBook, isbn: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>카테고리</label>
                <select
                  value={selectedBook.category}
                  onChange={(e) => setSelectedBook({ ...selectedBook, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>총 수량</label>
                <input
                  type="number"
                  value={selectedBook.total_copies}
                  onChange={(e) => setSelectedBook({ ...selectedBook, total_copies: e.target.value })}
                  min="1"
                />
              </div>
            </div>
            <div className="form-group">
              <label>위치</label>
              <input
                type="text"
                value={selectedBook.location || ''}
                onChange={(e) => setSelectedBook({ ...selectedBook, location: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn-cancel">
                취소
              </button>
              <button onClick={handleEditBook} className="btn-submit">
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBooks;
