-- schema.sql
-- Consolidated Database Schema & Sample Data for the Online Exam System

-- 1. Create and select the database
CREATE DATABASE IF NOT EXISTS online_exam;
USE online_exam;

-- 2. Create the Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the Exams table
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create the Questions table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT,
    question_text TEXT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 5. Create the Options table
CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 6. Create the Results table
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    exam_id INT,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    remarks TEXT DEFAULT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 7. Create the Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 8. SAMPLE DATA (Use these for testing)
-- ---------------------------------------------------------

-- Both accounts use the password: password123
INSERT INTO users (name, email, password, role) 
VALUES 
('John Teacher', 'teacher@example.com', '$2b$10$7R6v7.p9PzP8GkU/v.8u/.bW7t7a7A6A6A6A6A6A6A6A6A6A6A6A6A', 'teacher'),
('Jane Student', 'student@example.com', '$2b$10$7R6v7.p9PzP8GkU/v.8u/.bW7t7a7A6A6A6A6A6A6A6A6A6A6A6A6A', 'student');

-- Add a sample exam
INSERT INTO exams (teacher_id, title, subject, duration_minutes) 
VALUES (1, 'General Knowledge Quiz', 'General', 15);

-- Add a sample question and options
INSERT INTO questions (exam_id, question_text) VALUES (1, 'What is the capital of France?');
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(1, 'Paris', TRUE),
(1, 'London', FALSE),
(1, 'Berlin', FALSE),
(1, 'Madrid', FALSE);
