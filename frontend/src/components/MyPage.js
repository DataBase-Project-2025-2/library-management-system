import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyPage.css';

function MyPage() {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [readingGoal, setReadingGoal] = useState(null);
  const [targetBooks, setTargetBooks] = useState('');
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
      const [loansRes, reservationsRes, reviewsRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/members/${memberId}/loans`),
        axios.get(`http://localhost:3000/api/members/${memberId}/reservations`),
        axios.get(`http://localhost:3000/api/members/${memberId}/reviews`)
      ]);

      setLoans(loansRes.data.data || []);
      setReservations(reservationsRes.data.data || []);
      setReviews(reviewsRes.data.data || []);
      
      // 독서 목표 별도 조회
      fetchReadingGoal(memberId);
    } catch (error) {
      console.error('마이페이지 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadingGoal = async (memberId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/reading-goals/my-goal/${memberId}`);
      setReadingGoal(response.data.data);
      if (response.data.data.has_goal) {
        setTargetBooks(response.data.data.target_books.toString());
      }
    } catch (error) {
      console.error('독서 목표 조회 실패:', error);
    }
  };

  const handleSetGoal = async (e) => {
    e.preventDefault();
    
    const target = parseInt(targetBooks);
    if (!target || target < 1 || target > 1000) {
      alert('목표 권수는 1~1000 사이로 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/reading-goals/set-goal', {
        member_id: user.member_id,
        target_books: target
      });

      if (response.data.success) {
        alert(response.data.message);
        fetchReadingGoal(user.member_id);
      }
    } catch (error) {
      alert(error.response?.data?.error || '목표 설정에 실패했습니다.');
    }
  };

  const handleReturn = async (loanId, bookTitle) => {
    if (window.confirm(`"${bookTitle}"를 반납하시겠습니까?`)) {
      try {
        const response = await axios.post(`http://localhost:3000/api/loans/return/${loanId}`);
        if (response.data.success) {
          alert(response.data.message);
          fetchMyPageData(user.member_id);
        }
      } catch (error) {
        alert(error.response?.data?.error || '반납에 실패했습니다.');
      }
    }
  };

  const handleRenew = async (loanId, bookTitle) => {
    if (window.confirm(`"${bookTitle}"의 대출을 연장하시겠습니까?`)) {
      try {
        const response = await axios.post(`http://localhost:3000/api/loans/renew/${loanId}`);
        if (response.data.success) {
          alert(`연장 완료! 새로운 반납일: ${new Date(response.data.data.new_due_date).toLocaleDateString()}`);
          fetchMyPageData(user.member_id);
        }
      } catch (error) {
        alert(error.response?.data?.error || '연장에 실패했습니다.');
      }
    }
  };

  const handleCancelReservation = async (reservationId, bookTitle) => {
    if (window.confirm(`"${bookTitle}"의 예약을 취소하시겠습니까?`)) {
      try {
        const response = await axios.delete(`http://localhost:3000/api/reservations/${reservationId}`);
        if (response.data.success) {
          alert('예약이 취소되었습니다.');
          fetchMyPageData(user.member_id);
        }
      } catch (error) {
        alert(error.response?.data?.error || '예약 취소에 실패했습니다.');
      }
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
          🎯 독서 목표
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {/* 대출 현황 */}
        {activeTab === 'loans' && (
          <div className="tab-content">
            <h3>현재 대출 중인 도서</h3>
            {currentLoans.length === 0 ? (
              <p className="empty-message">현재 대출 중인 도서가 없습니다.</p>
            ) : (
              <div className="items-grid">
                {currentLoans.map(loan => (
                  <div key={loan.loan_id} className="item-card">
                    <h4>{loan.title}</h4>
                    <p className="author">저자: {loan.author}</p>
                    <p className="publisher">출판사: {loan.publisher}</p>
                    <div className="item-info">
                      <span className={`status-badge ${loan.status}`}>
                        {loan.status === 'borrowed' ? '대출중' : '연체'}
                      </span>
                      {loan.renewal_count !== undefined && (
                        <span className="renewal-info">연장 {loan.renewal_count}/2회</span>
                      )}
                    </div>
                    <div className="item-dates">
                      <p>대출일: {new Date(loan.loan_date).toLocaleDateString()}</p>
                      <p>반납예정일: {new Date(loan.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="item-actions">
                      <button
                        className="btn-action primary"
                        onClick={() => handleReturn(loan.loan_id, loan.title)}
                      >
                        반납하기
                      </button>
                      <button
                        className="btn-action secondary"
                        onClick={() => handleRenew(loan.loan_id, loan.title)}
                        disabled={loan.renewal_count >= 2}
                      >
                        {loan.renewal_count >= 2 ? '연장불가' : '연장하기'}
                      </button>
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
          <div className="tab-content">
            <h3>예약 목록</h3>
            {reservations.length === 0 ? (
              <p className="empty-message">예약 내역이 없습니다.</p>
            ) : (
              <div className="items-grid">
                {reservations.map(reservation => (
                  <div key={reservation.reservation_id} className="item-card">
                    <h4>{reservation.title}</h4>
                    <p className="author">저자: {reservation.author}</p>
                    <div className="item-info">
                      <span className={`status-badge ${reservation.status}`}>
                        {reservation.status === 'active' ? '예약중' :
                          reservation.status === 'fulfilled' ? '완료' : '취소'}
                      </span>
                    </div>
                    <div className="item-dates">
                      <p>예약일: {new Date(reservation.reservation_date).toLocaleDateString()}</p>
                      <p>만료일: {new Date(reservation.expiry_date).toLocaleDateString()}</p>
                    </div>
                    {reservation.status === 'active' && (
                      <div className="item-actions">
                        <button
                          className="btn-action danger"
                          onClick={() => handleCancelReservation(reservation.reservation_id, reservation.title)}
                        >
                          예약 취소
                        </button>
                      </div>
                    )}
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
            <h3>🎯 {new Date().getFullYear()}년 독서 목표</h3>
            
            {readingGoal && (
              <div className="goal-section">
                {readingGoal.has_goal ? (
                  <div className="goal-display">
                    <div className="goal-stats">
                      <div className="goal-stat-item">
                        <div className="goal-stat-value">{readingGoal.books_read}</div>
                        <div className="goal-stat-label">읽은 책</div>
                      </div>
                      <div className="goal-stat-divider">/</div>
                      <div className="goal-stat-item">
                        <div className="goal-stat-value">{readingGoal.target_books}</div>
                        <div className="goal-stat-label">목표</div>
                      </div>
                    </div>

                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${readingGoal.progress}%` }}
                      >
                        <span className="progress-text">{readingGoal.progress}%</span>
                      </div>
                    </div>

                    <p className="goal-message">
                      {readingGoal.progress >= 100 ? (
                        <span className="success">🎉 목표를 달성했습니다!</span>
                      ) : readingGoal.progress >= 75 ? (
                        <span>조금만 더 힘내세요! 목표 달성이 얼마 남지 않았습니다.</span>
                      ) : readingGoal.progress >= 50 ? (
                        <span>절반을 넘겼어요! 잘하고 있습니다.</span>
                      ) : readingGoal.progress >= 25 ? (
                        <span>좋은 시작입니다! 꾸준히 읽어보세요.</span>
                      ) : (
                        <span>새로운 책을 읽어보세요!</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="empty-message">아직 독서 목표가 설정되지 않았습니다.</p>
                )}

                <div className="goal-form">
                  <h4>목표 {readingGoal.has_goal ? '수정' : '설정'}하기</h4>
                  <form onSubmit={handleSetGoal}>
                    <div className="form-group">
                      <label>{new Date().getFullYear()}년에 읽을 책 권수</label>
                      <div className="input-with-button">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={targetBooks}
                          onChange={(e) => setTargetBooks(e.target.value)}
                          placeholder="예: 12"
                          required
                        />
                        <span className="input-unit">권</span>
                      </div>
                    </div>
                    <button type="submit" className="btn-submit-goal">
                      {readingGoal.has_goal ? '목표 수정' : '목표 설정'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;