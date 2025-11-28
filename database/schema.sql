-- 아주대학교 차세대 도서관 관리 시스템
-- Database Schema Design
-- Created: 2024-11-28

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS ajou_library 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ajou_library;

-- 1. 회원 테이블 (Members)
CREATE TABLE Members (
    member_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    grade INT,
    interests TEXT, -- JSON 형태로 관심분야 저장
    password_hash VARCHAR(255) NOT NULL,
    join_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 도서 테이블 (Books)
CREATE TABLE Books (
    book_id INT PRIMARY KEY AUTO_INCREMENT,
    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(100),
    publish_date DATE,
    category VARCHAR(50),
    keywords TEXT, -- 검색용 키워드
    description TEXT,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    location VARCHAR(100), -- 서가 위치
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_category (category),
    INDEX idx_isbn (isbn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 대출 테이블 (Loans)
CREATE TABLE Loans (
    loan_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    loan_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_date DATE NOT NULL,
    return_date DATE,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    renewal_count INT DEFAULT 0,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_book_id (book_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 예약 테이블 (Reservations)
CREATE TABLE Reservations (
    reservation_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    reservation_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    expiry_date DATE NOT NULL,
    status ENUM('active', 'fulfilled', 'cancelled', 'expired') DEFAULT 'active',
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_book_id (book_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 리뷰 테이블 (Reviews)
CREATE TABLE Reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date DATE DEFAULT (CURRENT_DATE),
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (member_id, book_id),
    INDEX idx_book_id (book_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 독서 목표 테이블 (ReadingGoals)
CREATE TABLE ReadingGoals (
    goal_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    year INT NOT NULL,
    target_books INT NOT NULL,
    current_books INT DEFAULT 0,
    goal_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    UNIQUE KEY unique_goal (member_id, year),
    INDEX idx_member_id (member_id),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 독서 이력 테이블 (ReadingHistory)
CREATE TABLE ReadingHistory (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    read_date DATE DEFAULT (CURRENT_DATE),
    reading_time INT, -- 분 단위
    pages_read INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_book_id (book_id),
    INDEX idx_read_date (read_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 트리거: 대출 시 재고 감소
DELIMITER //
CREATE TRIGGER after_loan_insert
AFTER INSERT ON Loans
FOR EACH ROW
BEGIN
    IF NEW.status = 'borrowed' THEN
        UPDATE Books 
        SET available_copies = available_copies - 1
        WHERE book_id = NEW.book_id;
    END IF;
END//
DELIMITER ;

-- 트리거: 반납 시 재고 증가
DELIMITER //
CREATE TRIGGER after_loan_update
AFTER UPDATE ON Loans
FOR EACH ROW
BEGIN
    IF OLD.status = 'borrowed' AND NEW.status = 'returned' THEN
        UPDATE Books 
        SET available_copies = available_copies + 1
        WHERE book_id = NEW.book_id;
    END IF;
END//
DELIMITER ;

-- 뷰: 인기 도서 (대출 횟수 기준)
CREATE VIEW PopularBooks AS
SELECT 
    b.book_id,
    b.title,
    b.author,
    b.category,
    COUNT(l.loan_id) as loan_count,
    AVG(r.rating) as avg_rating
FROM Books b
LEFT JOIN Loans l ON b.book_id = l.book_id
LEFT JOIN Reviews r ON b.book_id = r.book_id
GROUP BY b.book_id, b.title, b.author, b.category
ORDER BY loan_count DESC;

-- 뷰: 연체 대출 목록
CREATE VIEW OverdueLoans AS
SELECT 
    l.loan_id,
    m.name as member_name,
    m.student_id,
    b.title as book_title,
    l.loan_date,
    l.due_date,
    DATEDIFF(CURRENT_DATE, l.due_date) as days_overdue,
    l.fine_amount
FROM Loans l
JOIN Members m ON l.member_id = m.member_id
JOIN Books b ON l.book_id = b.book_id
WHERE l.status = 'overdue' OR (l.status = 'borrowed' AND l.due_date < CURRENT_DATE);
