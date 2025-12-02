import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import AdminBooks from './AdminBooks';
import AdminMembers from './AdminMembers';
import AdminLoans from './AdminLoans';
import AdminStatistics from './AdminStatistics';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('statistics');
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    activeLoans: 0,
    overdueLoans: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // 도서 통계
      const booksRes = await axios.get('http://localhost:3000/api/books');
      const totalBooks = booksRes.data.data.length;

      // 회원 통계
      const membersRes = await axios.get('http://localhost:3000/api/admin/members/statistics');
      const totalMembers = membersRes.data.data.overview.total_members;

      // 대출 통계
      const loansRes = await axios.get('http://localhost:3000/api/admin/operations/statistics/loans');
      const activeLoans = loansRes.data.data.overview.active_loans;
      const overdueLoans = loansRes.data.data.overview.overdue_loans;

      setStats({
        totalBooks,
        totalMembers,
        activeLoans,
        overdueLoans
      });
    } catch (error) {
      console.error('통계 조회 오류:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>⚙️ 관리자 대시보드</h1>
        <p>도서관 시스템 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📚
          </div>
          <div className="stat-info">
            <h3>{stats.totalBooks.toLocaleString()}</h3>
            <p>총 도서</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            👥
          </div>
          <div className="stat-info">
            <h3>{stats.totalMembers.toLocaleString()}</h3>
            <p>총 회원</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            📖
          </div>
          <div className="stat-info">
            <h3>{stats.activeLoans.toLocaleString()}</h3>
            <p>대출 중</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            ⚠️
          </div>
          <div className="stat-info">
            <h3>{stats.overdueLoans.toLocaleString()}</h3>
            <p>연체 중</p>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 통계
        </button>
        <button
          className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          📚 도서 관리
        </button>
        <button
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 회원 관리
        </button>
        <button
          className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          📖 대출 관리
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="dashboard-content">
        {activeTab === 'statistics' && <AdminStatistics />}
        {activeTab === 'books' && <AdminBooks onUpdate={fetchDashboardStats} />}
        {activeTab === 'members' && <AdminMembers />}
        {activeTab === 'loans' && <AdminLoans />}
      </div>
    </div>
  );
}

export default Dashboard;
