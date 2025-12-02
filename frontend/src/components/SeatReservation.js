import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SeatReservation.css';

function SeatReservation() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [seats, setSeats] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('zones');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchZones();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyReservations();
    }
  }, [user]);

  const fetchZones = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seats/zones');
      setZones(response.data.data || []);
    } catch (error) {
      console.error('좌석 현황 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async (zoneName) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/seats/zone/${encodeURIComponent(zoneName)}`);
      setSeats(response.data.data || []);
      setSelectedZone(zoneName);
      setActiveTab('seats');
    } catch (error) {
      console.error('좌석 목록 조회 실패:', error);
      alert('좌석 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReservations = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/seats/my-reservations/${user.member_id}`);
      setMyReservations(response.data.data || []);
    } catch (error) {
      console.error('예약 조회 실패:', error);
    }
  };

  const handleReserveSeat = async (seatId, seatNumber) => {
    const duration = prompt('사용 시간을 입력하세요 (1~4시간):', '2');
    
    if (!duration) return;
    
    const durationHours = parseInt(duration);
    if (isNaN(durationHours) || durationHours < 1 || durationHours > 4) {
      alert('사용 시간은 1~4시간 사이로 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/seats/reserve', {
        seat_id: seatId,
        member_id: user.member_id,
        duration_hours: durationHours
      });

      if (response.data.success) {
        alert(`좌석 ${seatNumber}번이 ${durationHours}시간 예약되었습니다.`);
        fetchSeats(selectedZone);
        fetchMyReservations();
        fetchZones();
      }
    } catch (error) {
      alert(error.response?.data?.error || '좌석 예약에 실패했습니다.');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('예약을 취소하시겠습니까?')) return;

    try {
      const response = await axios.delete(`http://localhost:3000/api/seats/cancel/${reservationId}`);
      if (response.data.success) {
        alert('예약이 취소되었습니다.');
        fetchMyReservations();
        fetchZones();
        if (selectedZone) {
          fetchSeats(selectedZone);
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || '예약 취소에 실패했습니다.');
    }
  };

  const handleCheckin = async (reservationId) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/seats/checkin/${reservationId}`);
      if (response.data.success) {
        alert('체크인이 완료되었습니다.');
        fetchMyReservations();
      }
    } catch (error) {
      alert(error.response?.data?.error || '체크인에 실패했습니다.');
    }
  };

  const getZoneIcon = (zoneName) => {
    if (zoneName.includes('멀티미디어')) return '💻';
    if (zoneName.includes('스터디')) return '📖';
    if (zoneName.includes('커뮤니티')) return '👥';
    return '📚';
  };

  const activeReservations = myReservations.filter(r => r.status === 'active' && new Date(r.end_time) > new Date());
  const pastReservations = myReservations.filter(r => r.status !== 'active' || new Date(r.end_time) <= new Date());

  if (loading && zones.length === 0) {
    return <div className="loading-container">로딩 중...</div>;
  }

  return (
    <div className="seat-reservation-container">
      <div className="page-header">
        <h1>🪑 좌석 예약</h1>
        <p>원하는 열람실 좌석을 예약하고 관리하세요</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="seat-tabs">
        <button
          className={`seat-tab ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          🏢 열람실 선택
        </button>
        <button
          className={`seat-tab ${activeTab === 'seats' ? 'active' : ''}`}
          onClick={() => selectedZone && setActiveTab('seats')}
          disabled={!selectedZone}
        >
          🪑 좌석 선택 {selectedZone && `(${selectedZone})`}
        </button>
        <button
          className={`seat-tab ${activeTab === 'myreservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('myreservations')}
        >
          📋 내 예약 ({activeReservations.length})
        </button>
      </div>

      {/* 구역 선택 */}
      {activeTab === 'zones' && (
        <div className="zones-section">
          <h2>열람실/스터디 공간</h2>
          <div className="zones-grid">
            {zones.map(zone => {
              const occupancyRate = ((zone.total_seats - zone.available_seats) / zone.total_seats * 100).toFixed(0);
              return (
                <div key={zone.zone} className="zone-card" onClick={() => fetchSeats(zone.zone)}>
                  <div className="zone-icon">{getZoneIcon(zone.zone)}</div>
                  <h3>{zone.zone}</h3>
                  <div className="zone-stats">
                    <div className="zone-stat">
                      <span className="stat-label">전체</span>
                      <span className="stat-value">{zone.total_seats}석</span>
                    </div>
                    <div className="zone-stat available">
                      <span className="stat-label">이용 가능</span>
                      <span className="stat-value">{zone.available_seats}석</span>
                    </div>
                  </div>
                  <div className="occupancy-bar">
                    <div 
                      className="occupancy-fill"
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                  <p className="occupancy-text">사용률 {occupancyRate}%</p>
                  <button className="select-zone-btn">좌석 선택하기</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 좌석 선택 */}
      {activeTab === 'seats' && selectedZone && (
        <div className="seats-section">
          <div className="seats-header">
            <button className="back-btn" onClick={() => setActiveTab('zones')}>
              ← 돌아가기
            </button>
            <h2>{selectedZone} - 좌석 선택</h2>
          </div>
          
          <div className="seats-legend">
            <div className="legend-item">
              <div className="seat-mini available"></div>
              <span>이용 가능</span>
            </div>
            <div className="legend-item">
              <div className="seat-mini occupied"></div>
              <span>사용 중</span>
            </div>
            <div className="legend-item">
              <div className="seat-mini unavailable"></div>
              <span>이용 불가</span>
            </div>
          </div>

          <div className="seats-grid">
            {seats.map(seat => {
              const isOccupied = seat.is_reserved;
              const isUnavailable = !seat.is_available;
              const isMyReservation = seat.reserved_by === user?.member_id;
              
              return (
                <div
                  key={seat.seat_id}
                  className={`seat-item ${isOccupied ? 'occupied' : ''} ${isUnavailable ? 'unavailable' : ''} ${isMyReservation ? 'my-seat' : ''}`}
                  onClick={() => {
                    if (!isOccupied && !isUnavailable && user) {
                      handleReserveSeat(seat.seat_id, seat.seat_number);
                    }
                  }}
                >
                  <div className="seat-number">{seat.seat_number}</div>
                  {seat.seat_type === 'pc' && <div className="seat-type-icon">💻</div>}
                  {isMyReservation && <div className="my-seat-badge">내 좌석</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 내 예약 */}
      {activeTab === 'myreservations' && (
        <div className="myreservations-section">
          <h2>내 좌석 예약</h2>
          
          <h3>🟢 진행 중인 예약</h3>
          {activeReservations.length === 0 ? (
            <p className="empty-message">현재 예약이 없습니다.</p>
          ) : (
            <div className="reservations-list">
              {activeReservations.map(res => (
                <div key={res.reservation_id} className="reservation-card active">
                  <div className="reservation-header">
                    <h4>{res.zone} - {res.seat_number}번</h4>
                    <span className="status-badge active">사용중</span>
                  </div>
                  <div className="reservation-info">
                    <p>⏰ {new Date(res.start_time).toLocaleString()} ~ {new Date(res.end_time).toLocaleString()}</p>
                    {res.checked_in ? (
                      <p className="checked-in">✅ 체크인 완료 ({new Date(res.checked_in_time).toLocaleString()})</p>
                    ) : (
                      <button 
                        className="checkin-btn"
                        onClick={() => handleCheckin(res.reservation_id)}
                      >
                        체크인하기
                      </button>
                    )}
                  </div>
                  <button 
                    className="cancel-btn"
                    onClick={() => handleCancelReservation(res.reservation_id)}
                  >
                    예약 취소
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3>⚪ 지난 예약</h3>
          {pastReservations.length === 0 ? (
            <p className="empty-message">지난 예약이 없습니다.</p>
          ) : (
            <div className="reservations-list">
              {pastReservations.slice(0, 10).map(res => (
                <div key={res.reservation_id} className="reservation-card past">
                  <div className="reservation-header">
                    <h4>{res.zone} - {res.seat_number}번</h4>
                    <span className={`status-badge ${res.status}`}>
                      {res.status === 'completed' ? '완료' : res.status === 'cancelled' ? '취소' : '노쇼'}
                    </span>
                  </div>
                  <div className="reservation-info">
                    <p>⏰ {new Date(res.start_time).toLocaleString()} ~ {new Date(res.end_time).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SeatReservation;
