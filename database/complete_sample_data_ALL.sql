-- 완전한 샘플 데이터 (430개) - 올인원
-- 아주대학교 차세대 도서관 관리 시스템

USE ajou_library;

-- ====================================
-- 기존 데이터 삭제 (깨끗하게 시작)
-- ====================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ReadingHistory;
TRUNCATE TABLE ReadingGoals;
TRUNCATE TABLE Reviews;
TRUNCATE TABLE Reservations;
TRUNCATE TABLE Loans;
TRUNCATE TABLE Books;
TRUNCATE TABLE Members;
SET FOREIGN_KEY_CHECKS = 1;

-- 이제 Part 1, Part 2, Part 3 내용을 여기 포함시킴
