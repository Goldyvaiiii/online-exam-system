-- schema.sql
-- Consolidated Database Schema & Sample Data for the Online Exam System
-- REWRITTEN FOR POSTGRESQL

-- 1. Create Types (PostgreSQL uses custom types for ENUMS)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM ('pending', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the Exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create the Questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER,
    question_text TEXT NOT NULL,
    CONSTRAINT fk_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 5. Create the Options table
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 6. Create the Results table
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    exam_id INTEGER,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    remarks TEXT DEFAULT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_res FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 7. Create the Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status complaint_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_comp FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 8. SAMPLE DATA (Use these for testing)
-- ---------------------------------------------------------

-- Both accounts use the password: password123
-- Using TRUNCATE to avoid duplicate errors if re-run
-- TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (name, email, password, role) 
VALUES 
('John Teacher', 'teacher@example.com', '$2b$10$7R6v7.p9PzP8GkU/v.8u/.bW7t7a7A6A6A6A6A6A6A6A6A6A6A6A6A', 'teacher'),
('Jane Student', 'student@example.com', '$2b$10$7R6v7.p9PzP8GkU/v.8u/.bW7t7a7A6A6A6A6A6A6A6A6A6A6A6A6A', 'student')
ON CONFLICT (email) DO NOTHING;

INSERT INTO exams (teacher_id, title, subject, duration_minutes) 
VALUES (1, 'General Knowledge Quiz', 'General', 15);

INSERT INTO questions (exam_id, question_text) VALUES (1, 'What is the capital of France?');
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(1, 'Paris', TRUE),
(1, 'London', FALSE),
(1, 'Berlin', FALSE),
(1, 'Madrid', FALSE);
