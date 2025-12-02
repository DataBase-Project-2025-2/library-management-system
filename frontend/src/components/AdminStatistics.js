import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdminStatistics.css';

function AdminStatistics() {
  const [period, setPeriod] = useState('30');
  const [loanStats, setLoanStats] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const [loansRes, membersRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/operations/statistics/loans', {
          params: { period }
        }),
        axios.get('http://localhost:3000/api/admin/members/statistics')
      ]);

      setLoanStats(loansRes.data.data);
      setMemberStats(membersRes.data.data);
    } catch (error) {
      console.error('통계 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !loanStats || !memberStats) {
    return <div className="loading">통계를 불러오는 중...</div>;
  }

  return (
    <div className="admin-statistics">
      {/* 기간 선택 */}
      <div className="statistics-header">
        <h2>📊 통계 리포트</h2>
        <div className="period-selector">
          <label>기간:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
            <option value="365">최근 1년</option>
          </select>
        </div>
      </div>

      {/* 전체 개요 */}
      <div className="statistics-overview">
        <div className="overview-card">
          <h3>📚 대출 통계</h3>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-label">총 대출</div>
              <div className="overview-value">{loanStats.overview.total_loans.toLocaleString()}건</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">대출 중</div>
              <div className="overview-value active">{loanStats.overview.active_loans.toLocaleString()}건</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">반납 완료</div>
              <div className="overview-value success">{loanStats.overview.returned_loans.toLocaleString()}건</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">연체 중</div>
              <div className="overview-value danger">{loanStats.overview.overdue_loans.toLocaleString()}건</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">총 연체료</div>
              <div className="overview-value">{loanStats.overview.total_overdue_fee?.toLocaleString() || 0}원</div>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>👥 회원 통계</h3>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-label">총 회원</div>
              <div className="overview-value">{memberStats.overview.total_members.toLocaleString()}명</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">활성 회원</div>
              <div className="overview-value success">{memberStats.overview.active_members.toLocaleString()}명</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">정지 회원</div>
              <div className="overview-value danger">{memberStats.overview.suspended_members.toLocaleString()}명</div>
            </div>
          </div>
        </div>
      </div>

      {/* 대출 추이 차트 */}
      <div className="chart-card">
        <h3>📈 일별 대출 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={loanStats.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
              formatter={(value) => [`${value}건`, '대출 수']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="loan_count" 
              name="대출 수" 
              stroke="#667eea" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 카테고리별 대출 & 학과별 회원 */}
      <div className="charts-row">
        {/* 카테고리별 대출 */}
        <div className="chart-card half">
          <h3>📚 카테고리별 대출</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanStats.by_category}
                dataKey="loan_count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
              >
                {loanStats.by_category.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}건`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 학과별 회원 TOP 10 */}
        <div className="chart-card half">
          <h3>🎓 학과별 회원 TOP 10</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberStats.by_department}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="department" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip formatter={(value) => `${value}명`} />
              <Bar dataKey="member_count" name="회원 수" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 인기 도서 TOP 10 */}
      <div className="chart-card">
        <h3>🏆 인기 도서 TOP 10</h3>
        <div className="popular-books-list">
          {loanStats.popular_books.map((book, index) => (
            <div key={book.book_id} className="popular-book-item">
              <div className="rank">{index + 1}</div>
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-meta">{book.author} | {book.category}</div>
              </div>
              <div className="loan-count">
                <span className="count-value">{book.loan_count}</span>
                <span className="count-label">회</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 활발한 회원 TOP 10 */}
      <div className="chart-card">
        <h3>🌟 활발한 회원 TOP 10</h3>
        <div className="active-members-list">
          {loanStats.active_members.map((member, index) => (
            <div key={member.member_id} className="active-member-item">
              <div className="rank">{index + 1}</div>
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-meta">{member.student_id} | {member.department || '-'}</div>
              </div>
              <div className="loan-count">
                <span className="count-value">{member.loan_count}</span>
                <span className="count-label">권</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 학년별 회원 분포 */}
      <div className="chart-card">
        <h3>📊 학년별 회원 분포</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={memberStats.by_grade}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" tickFormatter={(value) => `${value}학년`} />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => `${value}학년`}
              formatter={(value) => [`${value}명`, '회원 수']}
            />
            <Bar dataKey="member_count" name="회원 수" fill="#f093fb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AdminStatistics;
