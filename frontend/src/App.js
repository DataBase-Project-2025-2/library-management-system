import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import Home from './components/Home';
import Login from './components/Login';
import MyPage from './components/MyPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);

  // 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  };

  // 로그인 안 되어있으면 로그인 페이지 표시
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      {/* 네비게이션 바 */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">🏛️</span>
            <h2 className="nav-title">아주대학교 | 중앙도서관</h2>
          </div>
          <div className="nav-links">
            <button 
              className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              🏠 홈
            </button>
            <button 
              className={`nav-btn ${currentPage === 'books' ? 'active' : ''}`}
              onClick={() => setCurrentPage('books')}
            >
              📚 자료검색
            </button>
            <button 
              className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              ⚙️ 관리자
            </button>
            <button 
              className={`nav-btn ${currentPage === 'mypage' ? 'active' : ''}`}
              onClick={() => setCurrentPage('mypage')}
            >
              👤 마이페이지
            </button>
            <button 
              className="nav-btn logout-btn"
              onClick={handleLogout}
            >
              🚪 로그아웃 ({user.name})
            </button>
          </div>
        </div>
      </nav>

      {/* 페이지 렌더링 */}
      <main className="main-content">
        {currentPage === 'home' && <Home onNavigate={setCurrentPage} />}
        {currentPage === 'books' && <BookList />}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'mypage' && <MyPage />}
      </main>
    </div>
  );
}

export default App;
