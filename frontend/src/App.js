import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import Home from './components/Home';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

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
          </div>
        </div>
      </nav>

      {/* 페이지 렌더링 */}
      <main className="main-content">
        {currentPage === 'home' && <Home onNavigate={setCurrentPage} />}
        {currentPage === 'books' && <BookList />}
        {currentPage === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}

export default App;
