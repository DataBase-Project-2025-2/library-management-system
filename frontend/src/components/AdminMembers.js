import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminMembers.css';

function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [overdueMembers, setOverdueMembers] = useState([]);
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [currentPage, statusFilter]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/members/list', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchKeyword,
          status: statusFilter
        }
      });
      setMembers(response.data.data.members);
      setTotalPages(response.data.data.pagination.total_pages);
    } catch (error) {
      console.error('회원 목록 조회 오류:', error);
    }
  };

  const fetchMemberDetail = async (memberId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/admin/members/detail/${memberId}`);
      setSelectedMember(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('회원 상세 조회 오류:', error);
    }
  };

  const fetchOverdueMembers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/members/overdue');
      setOverdueMembers(response.data.data);
      setShowOverdueModal(true);
    } catch (error) {
      console.error('연체자 조회 오류:', error);
    }
  };

  const handleSuspend = async (memberId, currentStatus) => {
    const action = currentStatus === 'active' ? 'suspend' : 'activate';
    const actionText = action === 'suspend' ? '정지' : '활성화';
    const reason = action === 'suspend' ? prompt('정지 사유를 입력하세요:') : '';

    if (action === 'suspend' && !reason) return;

    try {
      await axios.put(`http://localhost:3000/api/admin/members/suspend/${memberId}`, {
        action,
        reason
      });
      alert(`회원이 ${actionText}되었습니다!`);
      fetchMembers();
      if (selectedMember && selectedMember.member.member_id === memberId) {
        setShowDetailModal(false);
      }
    } catch (error) {
      alert(error.response?.data?.error || `회원 ${actionText} 실패`);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers();
  };

  return (
    <div className="admin-members">
      {/* 검색 및 필터 */}
      <div className="admin-members-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="이름, 학번, 이메일 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="suspended">정지</option>
          </select>
          <button onClick={handleSearch} className="btn-search">🔍 검색</button>
        </div>
        <button onClick={fetchOverdueMembers} className="btn-overdue">
          ⚠️ 연체자 관리
        </button>
      </div>

      {/* 회원 목록 */}
      <div className="members-table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>학번</th>
              <th>학과</th>
              <th>이메일</th>
              <th>대출</th>
              <th>연체</th>
              <th>예약</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.member_id}>
                <td>{member.member_id}</td>
                <td className="member-name">{member.name}</td>
                <td>{member.student_id}</td>
                <td>{member.department || '-'}</td>
                <td className="member-email">{member.email || '-'}</td>
                <td>
                  <span className={member.current_loans > 0 ? 'badge-warning' : 'badge-info'}>
                    {member.current_loans}권
                  </span>
                </td>
                <td>
                  <span className={member.overdue_count > 0 ? 'badge-danger' : 'badge-success'}>
                    {member.overdue_count}권
                  </span>
                </td>
                <td>
                  <span className="badge-info">{member.active_reservations}건</span>
                </td>
                <td>
                  <span className={`status-badge ${member.status}`}>
                    {member.status === 'active' ? '활성' : '정지'}
                  </span>
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() => fetchMemberDetail(member.member_id)}
                    className="btn-detail"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleSuspend(member.member_id, member.status)}
                    className={member.status === 'active' ? 'btn-suspend' : 'btn-activate'}
                  >
                    {member.status === 'active' ? '🚫' : '✅'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="no-results">검색 결과가 없습니다.</div>
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

      {/* 회원 상세 모달 */}
      {showDetailModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>👤 회원 상세 정보</h2>

            {/* 기본 정보 */}
            <div className="member-detail-section">
              <h3>기본 정보</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>이름:</label>
                  <span>{selectedMember.member.name}</span>
                </div>
                <div className="info-item">
                  <label>학번:</label>
                  <span>{selectedMember.member.student_id}</span>
                </div>
                <div className="info-item">
                  <label>학과:</label>
                  <span>{selectedMember.member.department || '-'}</span>
                </div>
                <div className="info-item">
                  <label>학년:</label>
                  <span>{selectedMember.member.grade || '-'}</span>
                </div>
                <div className="info-item">
                  <label>이메일:</label>
                  <span>{selectedMember.member.email || '-'}</span>
                </div>
                <div className="info-item">
                  <label>전화번호:</label>
                  <span>{selectedMember.member.phone || '-'}</span>
                </div>
                <div className="info-item">
                  <label>상태:</label>
                  <span className={`status-badge ${selectedMember.member.status}`}>
                    {selectedMember.member.status === 'active' ? '활성' : '정지'}
                  </span>
                </div>
              </div>
            </div>

            {/* 대출 통계 */}
            <div className="member-detail-section">
              <h3>대출 통계</h3>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-value">{selectedMember.statistics.total_loans}</div>
                  <div className="stat-label">총 대출</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{selectedMember.statistics.current_loans}</div>
                  <div className="stat-label">현재 대출</div>
                </div>
                <div className="stat-box danger">
                  <div className="stat-value">{selectedMember.statistics.overdue_loans}</div>
                  <div className="stat-label">연체 중</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{selectedMember.statistics.total_overdue_fee?.toLocaleString() || 0}원</div>
                  <div className="stat-label">총 연체료</div>
                </div>
              </div>
            </div>

            {/* 최근 대출 이력 */}
            <div className="member-detail-section">
              <h3>최근 대출 이력</h3>
              <div className="history-list">
                {selectedMember.recent_loans.length > 0 ? (
                  selectedMember.recent_loans.map(loan => (
                    <div key={loan.loan_id} className="history-item">
                      <div className="history-book">
                        <strong>{loan.title}</strong>
                        <span className="history-author">{loan.author}</span>
                      </div>
                      <div className="history-dates">
                        <span>대출: {new Date(loan.loan_date).toLocaleDateString()}</span>
                        <span>반납: {loan.return_date ? new Date(loan.return_date).toLocaleDateString() : '대출 중'}</span>
                      </div>
                      {loan.overdue_fee > 0 && (
                        <div className="history-fee">
                          연체료: {loan.overdue_fee.toLocaleString()}원
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-data">대출 이력이 없습니다.</p>
                )}
              </div>
            </div>

            {/* 활성 예약 */}
            {selectedMember.active_reservations.length > 0 && (
              <div className="member-detail-section">
                <h3>활성 예약</h3>
                <div className="history-list">
                  {selectedMember.active_reservations.map(reservation => (
                    <div key={reservation.reservation_id} className="history-item">
                      <div className="history-book">
                        <strong>{reservation.title}</strong>
                        <span className="history-author">{reservation.author}</span>
                      </div>
                      <div className="history-dates">
                        <span>예약: {new Date(reservation.reservation_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => handleSuspend(selectedMember.member.member_id, selectedMember.member.status)}
                className={selectedMember.member.status === 'active' ? 'btn-suspend' : 'btn-activate'}
              >
                {selectedMember.member.status === 'active' ? '🚫 정지' : '✅ 활성화'}
              </button>
              <button onClick={() => setShowDetailModal(false)} className="btn-cancel">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 연체자 모달 */}
      {showOverdueModal && (
        <div className="modal-overlay" onClick={() => setShowOverdueModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ 연체자 목록</h2>
            <div className="overdue-list">
              {overdueMembers.length > 0 ? (
                <table className="overdue-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>학번</th>
                      <th>연체 권수</th>
                      <th>총 연체일</th>
                      <th>연체료</th>
                      <th>가장 빠른 반납일</th>
                      <th>연락처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueMembers.map(member => (
                      <tr key={member.member_id}>
                        <td>{member.name}</td>
                        <td>{member.student_id}</td>
                        <td><span className="badge-danger">{member.overdue_count}권</span></td>
                        <td>{member.total_overdue_days}일</td>
                        <td className="overdue-fee">{member.total_overdue_fee?.toLocaleString()}원</td>
                        <td>{new Date(member.earliest_due_date).toLocaleDateString()}</td>
                        <td>{member.phone || member.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">연체자가 없습니다! 🎉</p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowOverdueModal(false)} className="btn-cancel">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMembers;
