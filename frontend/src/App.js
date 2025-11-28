import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="App">
      {/* 네비게이션 바 */}
      <nav className="navbar">
        <div className="nav-container">
          <h2 className="nav-title">📚 아주대 도서관</h2>
          <div className="nav-links">
            <button 
              className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              📊 관리자
            </button>
            <button 
              className={`nav-btn ${currentPage === 'books' ? 'active' : ''}`}
              onClick={() => setCurrentPage('books')}
            >
              📚 도서 목록
            </button>
          </div>
        </div>
      </nav>

      {/* 페이지 렌더링 */}
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'books' && <BookList />}
      </main>
    </div>
  );
}

export default App;
