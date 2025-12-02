import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminLoans.css';

function AdminLoans() {
  const [loans, setLoans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reservations, setReservations] = useState([]);
  const [showReservationsModal, setShowReservationsModal] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, [currentPage, statusFilter]);

  const fetchLoans = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/operations/loans/all', {
        params: {
          status: statusFilter,
          page: currentPage,
          limit: 20
        }
      });
      setLoans(response.data.data.loans);
      setTotalPages(response.data.data.pagination.total_pages);
    } catch (error) {
      console.error('대출 목록 조회 오류:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/operations/reservations', {
        params: { status: 'active' }
      });
      setReservations(response.data.data);
      setShowReservationsModal(true);
    } catch (error) {
      console.error('예약 목록 조회 오류:', error);
    }
  };

  const handleForceReturn = async (loanId, title) => {
    const reason = prompt(`"${title}" 강제 반납 사유를 입력하세요:`);
    if (!reason) return;

    try {
      const response = await axios.post(
        `http://localhost:3000/api/admin/operations/loans/force-return/${loanId}`,
        { reason }
      );
      alert(`강제 반납되었습니다!\n연체료: ${response.data.data.overdue_fee.toLocaleString()}원`);
      fetchLoans();
    } catch (error) {
      alert(error.response?.data?.error || '강제 반납 실패');
    }
  };

  const handleCancelReservation = async (reservationId, title) => {
    const reason = prompt(`"${title}" 예약 취소 사유를 입력하세요:`);
    if (!reason) return;

    try {
      await axios.delete(
        `http://localhost:3000/api/admin/operations/reservations/cancel/${reservationId}`,
        { data: { reason } }
      );
      alert('예약이 취소되었습니다!');
      fetchReservations();
    } catch (error) {
      alert(error.response?.data?.error || '예약 취소 실패');
    }
  };

  const getStatusBadge = (loan) => {
    if (loan.loan_status === 'returned') {
      return <span className="status-badge returned">반납완료</span>;
    } else if (loan.loan_status === 'overdue') {
      return <span className="status-badge overdue">연체중</span>;
    } else {
      return <span className="status-badge active">대출중</span>;
    }
  };

  return (
    <div className="admin-loans">
      {/* 필터 및 액션 */}
      <div className="admin-loans-header">
        <div className="filter-bar">
          <label>상태:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">전체</option>
            <option value="active">대출중</option>
            <option value="overdue">연체중</option>
            <option value="returned">반납완료</option>
          </select>
        </div>
        <button onClick={fetchReservations} className="btn-reservations">
          📋 예약 관리
        </button>
      </div>

      {/* 대출 목록 */}
      <div className="loans-table-container">
        <table className="loans-table">
          <thead>
            <tr>
              <th>대출ID</th>
              <th>도서명</th>
              <th>회원명</th>
              <th>학번</th>
              <th>대출일</th>
              <th>반납예정일</th>
              <th>반납일</th>
              <th>연체료</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.loan_id}>
                <td>{loan.loan_id}</td>
                <td className="book-title">{loan.title}</td>
                <td>{loan.member_name}</td>
                <td>{loan.student_id}</td>
                <td>{new Date(loan.loan_date).toLocaleDateString()}</td>
                <td className={loan.loan_status === 'overdue' ? 'overdue-date' : ''}>
                  {new Date(loan.due_date).toLocaleDateString()}
                </td>
                <td>
                  {loan.return_date 
                    ? new Date(loan.return_date).toLocaleDateString() 
                    : '-'}
                </td>
                <td className="fee-amount">
                  {loan.calculated_fee > 0 
                    ? `${loan.calculated_fee.toLocaleString()}원` 
                    : '-'}
                </td>
                <td>{getStatusBadge(loan)}</td>
                <td className="action-buttons">
                  {!loan.return_date && (
                    <button
                      onClick={() => handleForceReturn(loan.loan_id, loan.title)}
                      className="btn-force-return"
                      title="강제 반납"
                    >
                      🔄
                    </button>
                  )}
                  {loan.phone && (
                    <a href={`tel:${loan.phone}`} className="btn-contact" title="전화">
                      📞
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loans.length === 0 && (
          <div className="no-results">대출 기록이 없습니다.</div>
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="pagination">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          ← 이전
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          다음 →
        </button>
      </div>

      {/* 예약 관리 모달 */}
      {showReservationsModal && (
        <div className="modal-overlay" onClick={() => setShowReservationsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>📋 활성 예약 목록</h2>
            <div className="reservations-table-container">
              {reservations.length > 0 ? (
                <table className="reservations-table">
                  <thead>
                    <tr>
                      <th>예약ID</th>
                      <th>도서명</th>
                      <th>회원명</th>
                      <th>학번</th>
                      <th>예약일</th>
                      <th>가능 권수</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(reservation => (
                      <tr key={reservation.reservation_id}>
                        <td>{reservation.reservation_id}</td>
                        <td className="book-title">{reservation.title}</td>
                        <td>{reservation.member_name}</td>
                        <td>{reservation.student_id}</td>
                        <td>{new Date(reservation.reservation_date).toLocaleDateString()}</td>
                        <td>
                          <span className={reservation.available_copies > 0 ? 'badge-success' : 'badge-warning'}>
                            {reservation.available_copies}권
                          </span>
                        </td>
                        <td className="action-buttons">
                          <button
                            onClick={() => handleCancelReservation(reservation.reservation_id, reservation.title)}
                            className="btn-cancel-reservation"
                            title="예약 취소"
                          >
                            ❌
                          </button>
                          {reservation.phone && (
                            <a href={`tel:${reservation.phone}`} className="btn-contact" title="전화">
                              📞
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">활성 예약이 없습니다.</p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowReservationsModal(false)} className="btn-cancel">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLoans;
