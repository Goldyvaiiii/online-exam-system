// backend/controllers/teacherController.js
// This handles everything related to teachers managing exams and questions.

const { db } = require('../db');

// @desc    Create a new exam
// @route   POST /api/teacher/exams
const createExam = async (req, res) => {
    try {
        const { title, subject, duration_minutes } = req.body;
        // req.user is set by our verifyToken middleware!
        const teacher_id = req.user.id;

        if (!title || !subject || !duration_minutes) {
            return res.status(400).json({ error: 'Please provide all exam details.' });
        }

        const [result] = await db.query(
            'INSERT INTO exams (teacher_id, title, subject, duration_minutes) VALUES (?, ?, ?, ?)',
            [teacher_id, title, subject, duration_minutes]
        );

        res.status(201).json({ message: 'Exam created successfully!', examId: result.insertId });
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: 'Server error while creating exam' });
    }
};

// @desc    Add a question with 4 options to a specific exam
// @route   POST /api/teacher/exams/:examId/questions
const addQuestion = async (req, res) => {
    // NOTE: We use a MySQL "transaction" here to ensure that if the options fail to insert, 
    // the question is also NOT saved. This prevents corrupted incomplete data!
    
    // Get a dedicated connection from the pool for our transaction
    const connection = await db.getConnection(); 
    try {
        const { examId } = req.params;
        const { question_text, options } = req.body;
        // 'options' should be an array of objects: [{text: 'A', isCorrect: true}, {text: 'B', isCorrect: false}, ...]

        // Basic validation
        if (!question_text || !options || options.length !== 4) {
            return res.status(400).json({ error: 'Please provide a question and exactly 4 options.' });
        }

        // Start transaction
        await connection.beginTransaction();

        // 1. Insert the question
        const [qResult] = await connection.query(
            'INSERT INTO questions (exam_id, question_text) VALUES (?, ?)',
            [examId, question_text]
        );
        const questionId = qResult.insertId;

        // 2. Insert all 4 options at once
        // By using a nested array, mysql2 allows us to do a "bulk insert"
        const optionsValues = options.map(opt => [questionId, opt.text, opt.isCorrect]);
        await connection.query(
            'INSERT INTO options (question_id, option_text, is_correct) VALUES ?',
            [optionsValues]
        );

        // Save all changes safely
        await connection.commit(); 

        res.status(201).json({ message: 'Question and options added successfully!' });
    } catch (error) {
        // Undo everything if an error occurs!
        await connection.rollback(); 
        console.error('Error adding question:', error);
        res.status(500).json({ error: 'Server error while adding question' });
    } finally {
        // Always return the connection to the pool when done
        connection.release(); 
    }
};

// @desc    Get all exams created by this teacher
// @route   GET /api/teacher/exams
const getTeacherExams = async (req, res) => {
    try {
        const teacher_id = req.user.id;
        const [exams] = await db.query('SELECT * FROM exams WHERE teacher_id = ? ORDER BY created_at DESC', [teacher_id]);
        res.status(200).json(exams);
    } catch (error) {
        console.error('Error fetching teacher exams:', error);
        res.status(500).json({ error: 'Server error while fetching exams' });
    }
};

// @desc    Get results for a specific exam created by this teacher
// @route   GET /api/teacher/exams/:examId/results
const getExamResults = async (req, res) => {
    try {
        const { examId } = req.params;
        const teacher_id = req.user.id;

        // Security: Ensure this teacher actually owns the exam before showing results!
        const [exams] = await db.query('SELECT id FROM exams WHERE id = ? AND teacher_id = ?', [examId, teacher_id]);
        if (exams.length === 0) {
            return res.status(403).json({ error: 'Not authorized to view these results' });
        }

        // Fetch results and join with the User table to get the student's name
        const [results] = await db.query(`
            SELECT r.id, r.score, r.total_questions, r.submitted_at, u.name as student_name, u.email as student_email
            FROM results r
            JOIN users u ON r.student_id = u.id
            WHERE r.exam_id = ?
            ORDER BY r.score DESC, r.submitted_at ASC
        `, [examId]);

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching exam results:', error);
        res.status(500).json({ error: 'Server error while fetching results' });
    }
};

// --- ADVANCED PHASE 2 METHODS ---

// @desc    Add a remark to a specific student's result
// @route   POST /api/teacher/results/:resultId/remark
const addRemark = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { remarks } = req.body;
        await db.query('UPDATE results SET remarks = ? WHERE id = ?', [remarks, resultId]);
        res.status(200).json({ message: 'Remark saved successfully' });
    } catch (error) {
        console.error('Error adding remark:', error);
        res.status(500).json({ error: 'Server error while saving remark' });
    }
};

// @desc    Get aggregate student records
// @route   GET /api/teacher/records
const getStudentRecords = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, 
                   COUNT(r.id) as total_exams, 
                   ROUND(IFNULL(AVG((r.score / r.total_questions) * 100), 0), 2) as average_score
            FROM users u
            LEFT JOIN results r ON u.id = r.student_id
            WHERE u.role = 'student'
            GROUP BY u.id
            ORDER BY average_score DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching student records:', error);
        res.status(500).json({ error: 'Server error fetching records' });
    }
};

// @desc    Get all complaints
// @route   GET /api/teacher/complaints
const getComplaints = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, u.name as student_name 
            FROM complaints c 
            JOIN users u ON c.student_id = u.id 
            ORDER BY c.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Resolve a complaint
// @route   POST /api/teacher/complaints/:complaintId/resolve
const resolveComplaint = async (req, res) => {
    try {
        const { complaintId } = req.params;
        await db.query('UPDATE complaints SET status = "resolved" WHERE id = ?', [complaintId]);
        res.status(200).json({ message: 'Complaint marked as resolved' });
    } catch (error) {
        console.error('Error resolving complaint:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createExam,
    addQuestion,
    getTeacherExams,
    getExamResults,
    addRemark,
    getStudentRecords,
    getComplaints,
    resolveComplaint
};
