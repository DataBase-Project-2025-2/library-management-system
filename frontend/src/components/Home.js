import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import BookDetail from './BookDetail';
import './Home.css';

function Home({ onNavigate }) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    currentLoans: 0,
    availableCopies: 0
  });
  const [myStats, setMyStats] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchMyStats();
    fetchRecommended();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/statistics/dashboard');
      const data = response.data.data;
      setStats({
        totalBooks: data.total_books || 0,
        totalMembers: data.total_members || 0,
        currentLoans: data.current_loans || 0,
        availableCopies: parseInt(data.available_copies) || 0
      });
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && !user.isAdmin) {
        const response = await axios.get(`http://localhost:3000/api/statistics/my-stats/${user.member_id}`);
        setMyStats(response.data.data);
      }
    } catch (error) {
      console.error('개인 통계 로드 실패:', error);
    }
  };

  const fetchRecommended = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && !user.isAdmin) {
        const response = await axios.get(`http://localhost:3000/api/statistics/recommended/${user.member_id}?limit=4`);
        setRecommended(response.data.data || []);
      }
    } catch (error) {
      console.error('추천 도서 로드 실패:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      localStorage.setItem('searchQuery', searchQuery);
      onNavigate('books');
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="home-container">
      {/* 히어로 섹션 */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="search-wrapper">
            <form onSubmit={handleSearch} className="search-box">
              <input
                type="text"
                placeholder="도서명, 저자, ISBN으로 검색하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>
            <p className="search-subtitle">아주대학교 중앙도서관 통합 검색</p>
          </div>
        </div>
      </section>

      {/* 빠른 메뉴 */}
      <section className="quick-menu-section">
        <div className="container">
          <div className="quick-menu-grid">
            <div className="quick-menu-card" onClick={() => onNavigate('books')}>
              <div className="menu-icon">📚</div>
              <h3>자료검색</h3>
              <p>도서 검색 및 대출</p>
            </div>
            <div className="quick-menu-card" onClick={() => onNavigate('popular')}>
              <div className="menu-icon">⭐</div>
              <h3>인기도서</h3>
              <p>대출 순위 TOP 20</p>
            </div>
            <div className="quick-menu-card" onClick={() => onNavigate('newarrivals')}>
              <div className="menu-icon">🆕</div>
              <h3>신착도서</h3>
              <p>최근 입고된 도서</p>
            </div>
            <div className="quick-menu-card" onClick={() => onNavigate('mypage')}>
              <div className="menu-icon">👤</div>
              <h3>My Library</h3>
              <p>나의 대출/예약 현황</p>
            </div>
          </div>
        </div>
      </section>

      {/* 개인화 섹션 (일반 사용자만) */}
      {user && !user.isAdmin && myStats && (
        <section className="personalized-section">
          <div className="container">
            <div className="section-row">
              {/* 내 독서 현황 */}
              <div className="my-stats-card">
                <h2>📊 내 독서 현황</h2>
                <div className="mini-stats-grid">
                  <div className="mini-stat-item">
                    <div className="mini-stat-value">{myStats.total_loans}</div>
                    <div className="mini-stat-label">총 대출</div>
                  </div>
                  <div className="mini-stat-item">
                    <div className="mini-stat-value">{myStats.monthly_loans}</div>
                    <div className="mini-stat-label">이번 달</div>
                  </div>
                  <div className="mini-stat-item">
                    <div className="mini-stat-value">{myStats.review_count}</div>
                    <div className="mini-stat-label">작성 서평</div>
                  </div>
                </div>

                {myStats.category_stats && myStats.category_stats.length > 0 && (
                  <div className="chart-container">
                    <h3>선호 카테고리</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={myStats.category_stats}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label
                        >
                          {myStats.category_stats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {myStats.recent_loans && myStats.recent_loans.length > 0 && (
                  <div className="recent-books">
                    <h3>최근 대출 도서</h3>
                    {myStats.recent_loans.map(book => (
                      <div key={book.book_id} className="recent-book-item">
                        <span className="book-title-small">{book.title}</span>
                        <span className="book-author-small">{book.author}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 추천 도서 */}
              <div className="recommended-card">
                <h2>📚 당신을 위한 추천</h2>
                <div className="recommended-books">
                  {recommended.length > 0 ? (
                    recommended.map(book => (
                      <div key={book.book_id} className="recommended-book">
                        <div className="book-cover-small">📖</div>
                        <div className="book-info-small">
                          <h4>{book.title}</h4>
                          <p>{book.author}</p>
                          <span className="category-small">{book.category}</span>
                        </div>
                        <button 
                          className="view-btn-small"
                          onClick={() => setSelectedBookId(book.book_id)}
                        >
                          상세
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-recommendations">대출 이력을 기반으로 추천해드릴게요!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 공지사항 & 개관시간 */}
      <section className="notice-section">
        <div className="container">
          <div className="notice-grid">
            <div className="notice-box">
              <h3>📢 공지사항</h3>
              <ul className="notice-list">
                <li>
                  <span className="notice-badge">공지</span>
                  <a href="#">2024학년도 2학기 도서관 운영시간 안내</a>
                  <span className="notice-date">2024.09.01</span>
                </li>
                <li>
                  <span className="notice-badge">공지</span>
                  <a href="#">기말고사 기간 열람실 24시간 개방</a>
                  <span className="notice-date">2024.11.25</span>
                </li>
                <li>
                  <span className="notice-badge education">교육</span>
                  <a href="#">신착도서 100권 입고 안내</a>
                  <span className="notice-date">2024.11.20</span>
                </li>
              </ul>
            </div>

            <div className="notice-box hours-box">
              <h3>🕐 개관시간</h3>
              <div className="hours-content">
                <div className="hours-item">
                  <strong>평일</strong>
                  <p>09:00 - 22:00</p>
                </div>
                <div className="hours-item">
                  <strong>주말</strong>
                  <p>10:00 - 18:00</p>
                  <p className="hours-note">※ 공휴일 휴관</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 전체 통계 */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalBooks.toLocaleString()}</div>
              <div className="stat-label">총 도서</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalMembers.toLocaleString()}</div>
              <div className="stat-label">회원 수</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.currentLoans.toLocaleString()}</div>
              <div className="stat-label">대출 중</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.availableCopies.toLocaleString()}</div>
              <div className="stat-label">대출 가능</div>
            </div>
          </div>
        </div>
      </section>

      {selectedBookId && (
        <BookDetail 
          bookId={selectedBookId} 
          onClose={() => setSelectedBookId(null)}
        />
      )}
    </div>
  );
}

export default Home;