import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyPage.css';

function MyPage() {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeTab, setActiveTab] = useState('loans');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchMyPageData(userData.member_id);
    }
  }, []);

  const fetchMyPageData = async (memberId) => {
    try {
      const [loansRes, reservationsRes, reviewsRes, goalsRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/members/${memberId}/loans`),
        axios.get(`http://localhost:3000/api/members/${memberId}/reservations`),
        axios.get(`http://localhost:3000/api/members/${memberId}/reviews`),
        axios.get(`http://localhost:3000/api/members/${memberId}/goals`)
      ]);

      setLoans(loansRes.data.data || []);
      setReservations(reservationsRes.data.data || []);
      setReviews(reviewsRes.data.data || []);
      setGoals(goalsRes.data.data || []);
    } catch (error) {
      console.error('마이페이지 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">로딩 중...</div>;
  }

  if (!user) {
    return <div className="error-container">사용자 정보를 불러올 수 없습니다.</div>;
  }

  const currentLoans = loans.filter(loan => loan.status === 'borrowed' || loan.status === 'overdue');
  const loanHistory = loans.filter(loan => loan.status === 'returned');
  const activeReservations = reservations.filter(r => r.status === 'active');

  return (
    <div className="mypage-container">
      {/* 사용자 정보 카드 */}
      <div className="user-info-card">
        <div className="user-avatar">👤</div>
        <div className="user-details">
          <h2>{user.name}</h2>
          <p className="user-id">학번: {user.student_id}</p>
          <p className="user-dept">{user.department} {user.grade}학년</p>
          <p className="user-email">📧 {user.email}</p>
        </div>
        <div className="user-stats">
          <div className="stat-item">
            <div className="stat-number">{currentLoans.length}</div>
            <div className="stat-label">현재 대출</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{activeReservations.length}</div>
            <div className="stat-label">예약 중</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{reviews.length}</div>
            <div className="stat-label">작성 서평</div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="mypage-tabs">
        <button 
          className={`tab ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          📚 대출 현황 ({currentLoans.length})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📖 대출 이력 ({loanHistory.length})
        </button>
        <button 
          className={`tab ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📝 예약 ({reservations.length})
        </button>
        <button 
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ 서평 ({reviews.length})
        </button>
        <button 
          className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 독서 목표 ({goals.length})
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {/* 대출 현황 */}
        {activeTab === 'loans' && (
          <div className="content-section">
            <h3>현재 대출 중인 도서</h3>
            {currentLoans.length === 0 ? (
              <p className="empty-message">대출 중인 도서가 없습니다.</p>
            ) : (
              <div className="items-list">
                {currentLoans.map(loan => (
                  <div key={loan.loan_id} className="item-card">
                    <div className="item-header">
                      <h4>{loan.title}</h4>
                      <span className={`status-badge ${loan.status}`}>
                        {loan.status === 'overdue' ? '연체' : '대출중'}
                      </span>
                    </div>
                    <p className="item-author">저자: {loan.author}</p>
                    <p className="item-publisher">출판사: {loan.publisher}</p>
                    <div className="item-dates">
                      <span>대출일: {new Date(loan.loan_date).toLocaleDateString()}</span>
                      <span className={loan.status === 'overdue' ? 'overdue-text' : ''}>
                        반납예정: {new Date(loan.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 대출 이력 */}
        {activeTab === 'history' && (
          <div className="content-section">
            <h3>대출 이력</h3>
            {loanHistory.length === 0 ? (
              <p className="empty-message">대출 이력이 없습니다.</p>
            ) : (
              <div className="items-list">
                {loanHistory.map(loan => (
                  <div key={loan.loan_id} className="item-card">
                    <div className="item-header">
                      <h4>{loan.title}</h4>
                      <span className="status-badge returned">반납완료</span>
                    </div>
                    <p className="item-author">저자: {loan.author}</p>
                    <div className="item-dates">
                      <span>대출일: {new Date(loan.loan_date).toLocaleDateString()}</span>
                      <span>반납일: {new Date(loan.return_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 예약 */}
        {activeTab === 'reservations' && (
          <div className="content-section">
            <h3>예약 목록</h3>
            {reservations.length === 0 ? (
              <p className="empty-message">예약한 도서가 없습니다.</p>
            ) : (
              <div className="items-list">
                {reservations.map(reservation => (
                  <div key={reservation.reservation_id} className="item-card">
                    <div className="item-header">
                      <h4>{reservation.title}</h4>
                      <span className={`status-badge ${reservation.status}`}>
                        {reservation.status === 'active' ? '예약중' : 
                         reservation.status === 'fulfilled' ? '완료' : '취소'}
                      </span>
                    </div>
                    <p className="item-author">저자: {reservation.author}</p>
                    <div className="item-dates">
                      <span>예약일: {new Date(reservation.reservation_date).toLocaleDateString()}</span>
                      <span>만료일: {new Date(reservation.expiry_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 서평 */}
        {activeTab === 'reviews' && (
          <div className="content-section">
            <h3>작성한 서평</h3>
            {reviews.length === 0 ? (
              <p className="empty-message">작성한 서평이 없습니다.</p>
            ) : (
              <div className="items-list">
                {reviews.map(review => (
                  <div key={review.review_id} className="item-card review-card">
                    <div className="item-header">
                      <h4>{review.title}</h4>
                      <div className="rating">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    <p className="review-date">
                      작성일: {new Date(review.review_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 독서 목표 */}
        {activeTab === 'goals' && (
          <div className="content-section">
            <h3>독서 목표</h3>
            {goals.length === 0 ? (
              <p className="empty-message">설정된 독서 목표가 없습니다.</p>
            ) : (
              <div className="goals-list">
                {goals.map(goal => {
                  const progress = (goal.current_books / goal.target_books) * 100;
                  return (
                    <div key={goal.goal_id} className="goal-card">
                      <div className="goal-header">
                        <h4>{goal.year}년 독서 목표</h4>
                        <span className="goal-numbers">
                          {goal.current_books} / {goal.target_books}권
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <p className="progress-text">
                        {progress.toFixed(0)}% 달성
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;