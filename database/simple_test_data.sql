-- 테스트용 샘플 데이터 (간단 버전)
-- 회원 10명, 도서 20권, 대출 15개, 예약 3개, 리뷰 3개

USE ajou_library;

-- 기존 데이터 삭제
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM ReadingHistory;
DELETE FROM ReadingGoals;
DELETE FROM Reviews;
DELETE FROM Reservations;
DELETE FROM Loans;
DELETE FROM Books;
DELETE FROM Members;
SET FOREIGN_KEY_CHECKS = 1;

-- 회원 10명
INSERT INTO Members (student_id, name, email, phone, department, grade, interests, password_hash, join_date, status) VALUES
('2020001', '김민수', 'minsu.kim@ajou.ac.kr', '010-1111-0001', '소프트웨어학과', 4, 'programming,AI', '$2b$10$hash', '2020-03-01', 'active'),
('2020002', '이서연', 'seoyeon.lee@ajou.ac.kr', '010-1111-0002', '전자공학과', 4, 'IoT,embedded', '$2b$10$hash', '2020-03-01', 'active'),
('2021001', '박지훈', 'jihoon.park@ajou.ac.kr', '010-2222-0001', '컴퓨터공학과', 3, 'network,security', '$2b$10$hash', '2021-03-01', 'active'),
('2021002', '최유진', 'yujin.choi@ajou.ac.kr', '010-2222-0002', '사이버보안학과', 3, 'hacking,forensic', '$2b$10$hash', '2021-03-01', 'active'),
('2022001', '정하은', 'haeun.jung@ajou.ac.kr', '010-3333-0001', '데이터사이언스학과', 2, 'ML,statistics', '$2b$10$hash', '2022-03-01', 'active'),
('2022002', '강태민', 'taemin.kang@ajou.ac.kr', '010-3333-0002', '소프트웨어학과', 2, 'web,React', '$2b$10$hash', '2022-03-01', 'active'),
('2023001', '윤서아', 'seoa.yoon@ajou.ac.kr', '010-4444-0001', '인공지능학과', 1, 'DL,NLP', '$2b$10$hash', '2023-03-01', 'active'),
('2023002', '임준혁', 'junhyuk.lim@ajou.ac.kr', '010-4444-0002', '전자공학과', 1, 'circuit,signal', '$2b$10$hash', '2023-03-01', 'active'),
('2024001', '한예린', 'yerin.han@ajou.ac.kr', '010-5555-0001', '미디어학과', 1, 'design,UX', '$2b$10$hash', '2024-03-01', 'active'),
('2024002', '송민재', 'minjae.song@ajou.ac.kr', '010-5555-0002', '소프트웨어학과', 1, 'mobile,Flutter', '$2b$10$hash', '2024-03-01', 'active');

-- 도서 20권
INSERT INTO Books (isbn, title, author, publisher, publish_date, category, keywords, description, total_copies, available_copies, location) VALUES
('978-0135957059', 'The Pragmatic Programmer', 'David Thomas', 'Addison-Wesley', '2019-09-13', '프로그래밍', 'pragmatic, programmer', '실용주의 프로그래머', 5, 4, 'A-101'),
('978-0132350884', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', '2008-08-01', '프로그래밍', 'clean code, refactoring', '클린 코드', 6, 5, 'A-102'),
('978-0134685991', 'Effective Java', 'Joshua Bloch', 'Addison-Wesley', '2017-12-27', '프로그래밍', 'java, best practices', 'Java 프로그래밍', 4, 4, 'A-103'),
('978-0596517748', 'JavaScript Good Parts', 'Douglas Crockford', 'O Reilly', '2008-05-08', '프로그래밍', 'javascript, web', 'JavaScript 핵심', 5, 4, 'A-104'),
('978-1491950296', 'Python Crash Course', 'Eric Matthes', 'No Starch Press', '2019-05-03', '프로그래밍', 'python, beginner', 'Python 입문', 7, 6, 'A-105'),
('978-0262033848', 'Introduction to Algorithms', 'Thomas Cormen', 'MIT Press', '2009-07-31', '알고리즘', 'algorithms, CLRS', '알고리즘 입문', 8, 7, 'B-101'),
('978-0984782857', 'Cracking the Coding Interview', 'Gayle McDowell', 'CareerCup', '2015-07-01', '알고리즘', 'coding interview', '코딩 인터뷰', 7, 7, 'B-102'),
('978-1617295485', 'Grokking Algorithms', 'Aditya Bhargava', 'Manning', '2016-05-12', '알고리즘', 'algorithms, beginner', '그림으로 배우는 알고리즘', 6, 6, 'B-103'),
('978-0262035613', 'Deep Learning', 'Ian Goodfellow', 'MIT Press', '2016-11-10', '인공지능', 'deep learning, AI', '딥러닝', 7, 7, 'C-101'),
('978-0262018029', 'Artificial Intelligence', 'Stuart Russell', 'Pearson', '2020-04-28', '인공지능', 'AI, artificial intelligence', '인공지능', 6, 6, 'C-102'),
('978-1491962299', 'Hands-On ML', 'Aurélien Géron', 'O Reilly', '2019-10-15', '인공지능', 'machine learning', '머신러닝 실습', 6, 6, 'C-103'),
('978-0201633610', 'Database System Concepts', 'Abraham Silberschatz', 'McGraw-Hill', '2019-02-05', '데이터베이스', 'database, DBMS', '데이터베이스 시스템', 6, 6, 'D-101'),
('978-0321884497', 'Database Management Systems', 'Raghu Ramakrishnan', 'McGraw-Hill', '2014-08-01', '데이터베이스', 'DBMS, SQL', '데이터베이스 관리', 5, 5, 'D-102'),
('978-1449373320', 'Designing Data-Intensive Apps', 'Martin Kleppmann', 'O Reilly', '2017-03-16', '데이터베이스', 'data, systems', '데이터 중심 앱', 5, 5, 'D-103'),
('978-0133594140', 'Computer Networking', 'James Kurose', 'Pearson', '2016-05-06', '네트워크', 'networking, TCP/IP', '컴퓨터 네트워킹', 7, 7, 'E-101'),
('978-0201633467', 'TCP/IP Illustrated', 'W. Richard Stevens', 'Addison-Wesley', '2011-11-08', '네트워크', 'TCP/IP, protocols', 'TCP/IP 완벽 가이드', 5, 5, 'E-102'),
('978-1119508168', 'The Art of Intrusion', 'Kevin Mitnick', 'Wiley', '2005-09-23', '보안', 'hacking, social engineering', '침입의 예술', 5, 5, 'E-103'),
('978-1593279677', 'Black Hat Python', 'Justin Seitz', 'No Starch Press', '2021-06-29', '보안', 'python, hacking', 'Black Hat Python', 4, 4, 'E-104'),
('978-1593271442', 'Hacking Exploitation', 'Jon Erickson', 'No Starch Press', '2008-02-07', '보안', 'hacking, exploitation', '해킹의 기술', 5, 5, 'E-105'),
('978-1118987124', 'Web Application Hackers Handbook', 'Dafydd Stuttard', 'Wiley', '2011-09-27', '보안', 'web hacking', '웹 해커 핸드북', 4, 4, 'E-106');

-- 대출 15개
INSERT INTO Loans (member_id, book_id, loan_date, due_date, return_date, status, renewal_count, fine_amount) VALUES
(1, 1, '2024-10-01', '2024-10-15', '2024-10-14', 'returned', 0, 0.00),
(1, 6, '2024-10-16', '2024-10-30', '2024-10-29', 'returned', 0, 0.00),
(2, 2, '2024-10-02', '2024-10-16', '2024-10-15', 'returned', 0, 0.00),
(3, 3, '2024-10-03', '2024-10-17', '2024-10-16', 'returned', 0, 0.00),
(4, 4, '2024-10-04', '2024-10-18', '2024-10-17', 'returned', 0, 0.00),
(5, 5, '2024-10-05', '2024-10-19', '2024-10-18', 'returned', 0, 0.00),
(6, 7, '2024-11-01', '2024-11-15', '2024-11-14', 'returned', 0, 0.00),
(7, 8, '2024-11-02', '2024-11-16', '2024-11-15', 'returned', 0, 0.00),
(8, 9, '2024-11-03', '2024-11-17', '2024-11-16', 'returned', 0, 0.00),
(1, 10, '2024-11-20', '2024-12-04', NULL, 'borrowed', 0, 0.00),
(2, 11, '2024-11-21', '2024-12-05', NULL, 'borrowed', 0, 0.00),
(3, 12, '2024-11-22', '2024-12-06', NULL, 'borrowed', 0, 0.00),
(4, 13, '2024-11-23', '2024-12-07', NULL, 'borrowed', 0, 0.00),
(5, 14, '2024-11-24', '2024-12-08', NULL, 'borrowed', 0, 0.00),
(9, 15, '2024-10-15', '2024-10-29', NULL, 'overdue', 0, 5000.00);

-- 예약 3개
INSERT INTO Reservations (member_id, book_id, reservation_date, expiry_date, status, notification_sent) VALUES
(6, 1, '2024-11-25', '2024-12-02', 'active', FALSE),
(7, 2, '2024-11-26', '2024-12-03', 'active', FALSE),
(8, 4, '2024-11-27', '2024-12-04', 'active', TRUE);

-- 리뷰 3개
INSERT INTO Reviews (member_id, book_id, rating, comment, review_date, likes_count) VALUES
(1, 1, 5, '정말 훌륭한 책입니다! 실용적인 프로그래밍의 핵심을 잘 담고 있어요.', '2024-10-15', 15),
(2, 2, 5, '클린 코드는 모든 개발자의 필독서입니다. 강력 추천합니다!', '2024-10-16', 20),
(6, 7, 5, '코딩 인터뷰 준비에 정말 도움이 많이 됐습니다.', '2024-11-15', 12);

-- 독서 목표 2개
INSERT INTO ReadingGoals (member_id, year, target_books, current_books, goal_description) VALUES
(1, 2024, 30, 28, '2024년 30권 읽기 챌린지'),
(5, 2024, 20, 15, 'IT 전문서 20권 완독');

-- 독서 이력 2개
INSERT INTO ReadingHistory (member_id, book_id, read_date, reading_time, pages_read, notes) VALUES
(1, 1, '2024-10-14', 180, 100, 'The Pragmatic Programmer - 실용주의 원칙 정리'),
(2, 2, '2024-10-15', 150, 80, 'Clean Code - 클린 코드 작성 원칙 학습');
