import React, { useState, useEffect } from 'react';
import { statsAPI } from '../api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, booksRes] = await Promise.all([
        statsAPI.getDashboard(),
        statsAPI.getPopularBooks(5)
      ]);
      
      setStats(statsRes.data.data);
      setPopularBooks(booksRes.data.data);
      setError(null);
    } catch (err) {
      console.error('대시보드 데이터 로딩 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <h1>📚 아주대학교 도서관 관리 시스템</h1>
      
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>총 회원</h3>
          <p className="stat-number">{stats?.total_members || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>총 도서</h3>
          <p className="stat-number">{stats?.total_books || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>대출 중</h3>
          <p className="stat-number">{stats?.current_loans || 0}</p>
        </div>
        
        <div className="stat-card warning">
          <h3>연체</h3>
          <p className="stat-number">{stats?.overdue_loans || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>활성 예약</h3>
          <p className="stat-number">{stats?.active_reservations || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>대출 가능</h3>
          <p className="stat-number">{stats?.available_copies || 0}</p>
        </div>
      </div>

      {/* 인기 도서 */}
      <div className="popular-books">
        <h2>📖 인기 도서 TOP 5</h2>
        <div className="books-list">
          {popularBooks.map((book, index) => (
            <div key={book.book_id} className="book-item">
              <span className="rank">#{index + 1}</span>
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="author">{book.author}</p>
                <p className="category">{book.category}</p>
              </div>
              <div className="book-stats">
                <span className="loan-count">대출 {book.loan_count}회</span>
                {book.average_rating && (
                  <span className="rating">⭐ {book.average_rating}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
