import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

function Home({ onNavigate }) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    currentLoans: 0,
    availableCopies: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/statistics/dashboard');
      console.log('API 응답:', response.data); // 디버깅용
      const data = response.data.data; // data.data로 접근!
      console.log('실제 데이터:', data); // 디버깅용
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

  return (
    <div className="home-container">
      {/* 히어로 섹션 */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="search-wrapper">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="소장자료와 전자자료를 한번에 검색합니다."
                className="search-input"
              />
              <button className="search-btn">
                🔍
              </button>
            </div>
            <p className="search-subtitle">도서명, 저자명, ISBN으로 검색하세요</p>
          </div>
        </div>
      </section>

      {/* 빠른 메뉴 */}
      <section className="quick-menu-section">
        <div className="container">
          <div className="quick-menu-grid">
            <div className="quick-menu-card" onClick={() => onNavigate('books')}>
              <div className="menu-icon">📖</div>
              <h3>자료검색</h3>
              <p>도서 및 전자자료 검색</p>
            </div>
            <div className="quick-menu-card">
              <div className="menu-icon">⭐</div>
              <h3>인기도서</h3>
              <p>대출 순위 TOP 10</p>
            </div>
            <div className="quick-menu-card">
              <div className="menu-icon">🆕</div>
              <h3>신착도서</h3>
              <p>최근 입고된 도서</p>
            </div>
            <div className="quick-menu-card">
              <div className="menu-icon">📚</div>
              <h3>My Library</h3>
              <p>대출/예약 현황</p>
            </div>
          </div>
        </div>
      </section>

      {/* 공지사항 */}
      <section className="notice-section">
        <div className="container">
          <div className="notice-grid">
            <div className="notice-box">
              <h3>📢 공지사항</h3>
              <ul className="notice-list">
                <li>
                  <span className="notice-badge">운영</span>
                  <a href="#">도서관 열람실 이용제한 안내</a>
                  <span className="notice-date">2024.11.28</span>
                </li>
                <li>
                  <span className="notice-badge education">교육·행사</span>
                  <a href="#">계절을 읽다: 북트레일러 영상 공모전</a>
                  <span className="notice-date">2024.11.11</span>
                </li>
                <li>
                  <span className="notice-badge">운영</span>
                  <a href="#">기말시험 열람실 확대 운영 안내</a>
                  <span className="notice-date">2024.11.24</span>
                </li>
              </ul>
            </div>
            <div className="notice-box hours-box">
              <h3>🕐 개관시간</h3>
              <div className="hours-content">
                <div className="hours-item">
                  <strong>자료실 (학기중)</strong>
                  <p>월-금: 09:00 ~ 21:00</p>
                  <p>토: 10:00 ~ 16:00</p>
                  <p className="hours-note">일요일/공휴일 휴관</p>
                </div>
                <div className="hours-item">
                  <strong>열람실</strong>
                  <p>24시간 운영</p>
                  <p className="hours-note">연중 무휴</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="stats-section">
        <div className="container">
          {loading ? (
            <div className="stats-loading">데이터 로딩 중...</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalBooks.toLocaleString()}</div>
                <div className="stat-label">총 도서</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalMembers.toLocaleString()}</div>
                <div className="stat-label">등록 회원</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.currentLoans.toLocaleString()}</div>
                <div className="stat-label">현재 대출 중</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.availableCopies.toLocaleString()}</div>
                <div className="stat-label">대출 가능</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
