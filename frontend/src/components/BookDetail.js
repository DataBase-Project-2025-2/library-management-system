import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookDetail.css';

function BookDetail({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchBookDetail();
  }, [bookId]);

  const fetchBookDetail = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/books/${bookId}`);
      setBook(response.data.data);
    } catch (error) {
      console.error('도서 상세 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="book-detail-overlay" onClick={onClose}>
        <div className="book-detail-container" onClick={e => e.stopPropagation()}>
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-detail-overlay" onClick={onClose}>
        <div className="book-detail-container" onClick={e => e.stopPropagation()}>
          <div className="error">도서 정보를 불러올 수 없습니다.</div>
          <button onClick={onClose} className="close-btn">닫기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-detail-overlay" onClick={onClose}>
      <div className="book-detail-container" onClick={e => e.stopPropagation()}>
        <button className="close-btn-top" onClick={onClose}>✕</button>
        
        <div className="book-detail-content">
          {/* 왼쪽: 도서 표지 */}
          <div className="book-cover-section">
            <div className="book-cover-placeholder">
              📚
            </div>
          </div>

          {/* 중앙: 도서 정보 */}
          <div className="book-info-section">
            <h2 className="book-title">{book.title}</h2>
            
            <table className="book-info-table">
              <tbody>
                <tr>
                  <th>자료유형</th>
                  <td>단행본(국내)</td>
                </tr>
                <tr>
                  <th>저자</th>
                  <td>{book.author}</td>
                </tr>
                <tr>
                  <th>발행사항</th>
                  <td>{book.publisher}, {book.publication_year}</td>
                </tr>
                <tr>
                  <th>ISBN</th>
                  <td>{book.isbn || 'N/A'}</td>
                </tr>
                <tr>
                  <th>카테고리</th>
                  <td>{book.category}</td>
                </tr>
              </tbody>
            </table>

            {/* 탭 메뉴 */}
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                소장정보
              </button>
              <button 
                className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                서평
              </button>
            </div>

            {/* 탭 내용 */}
            {activeTab === 'info' && (
              <div className="tab-content">
                <h3>소장도서관</h3>
                <table className="holdings-table">
                  <thead>
                    <tr>
                      <th>등록번호</th>
                      <th>소장위치</th>
                      <th>청구기호</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>3011224020</td>
                      <td>1층·신간자료실</td>
                      <td>811.87 문94호</td>
                      <td><span className="status available">대출가능</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="tab-content">
                <div className="reviews-section">
                  <p>서평이 없습니다.</p>
                  <button className="write-review-btn">서평 작성하기</button>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 통계 & 관련 도서 */}
          <div className="book-side-section">
            <div className="like-section">
              <div className="like-count">0명이 좋아합니다</div>
              <button className="like-btn">
                👍 좋아요 <span>0</span>
              </button>
            </div>

            <div className="stats-section">
              <h3>이용통계</h3>
              <div className="stats-tabs">
                <button className="stat-tab active">조회</button>
                <button className="stat-tab">대출</button>
              </div>
              <div className="stats-chart">
                <div className="chart-placeholder">
                  📊 대출 통계 그래프
                </div>
                <p className="stats-note">최근 3년간 통계 (매월 갱신)</p>
              </div>
            </div>

            <div className="related-books-section">
              <h3>관련 인기도서</h3>
              <div className="related-books-list">
                <p className="no-data">관련 도서가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="book-actions">
          <button className="action-btn primary">대출하기</button>
          <button className="action-btn secondary">예약하기</button>
          <button className="action-btn secondary">내 서재에 담기</button>
        </div>
      </div>
    </div>
  );
}

export default BookDetail;
