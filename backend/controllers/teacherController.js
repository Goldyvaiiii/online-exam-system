// backend/controllers/teacherController.js
const { db } = require('../db');

// @desc    Create a new exam
const createExam = async (req, res) => {
    try {
        const { title, subject, duration_minutes } = req.body;
        const teacher_id = req.user.id;

        if (!title || !subject || !duration_minutes) {
            return res.status(400).json({ error: 'Please provide all exam details.' });
        }

        const { rows } = await db.query(
            'INSERT INTO exams (teacher_id, title, subject, duration_minutes) VALUES ($1, $2, $3, $4) RETURNING id',
            [teacher_id, title, subject, duration_minutes]
        );

        res.status(201).json({ message: 'Exam created successfully!', examId: rows[0].id });
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: 'Server error while creating exam' });
    }
};

// @desc    Add a question with 4 options
const addQuestion = async (req, res) => {
    const client = await db.connect();
    try {
        const { examId } = req.params;
        const { question_text, options } = req.body;

        if (!question_text || !options || options.length !== 4) {
            return res.status(400).json({ error: 'Please provide a question and exactly 4 options.' });
        }

        await client.query('BEGIN');

        // 1. Insert the question
        const qResult = await client.query(
            'INSERT INTO questions (exam_id, question_text) VALUES ($1, $2) RETURNING id',
            [examId, question_text]
        );
        const questionId = qResult.rows[0].id;

        // 2. Insert all 4 options
        for (const opt of options) {
            await client.query(
                'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
                [questionId, opt.text, opt.isCorrect]
            );
        }

        await client.query('COMMIT'); 

        res.status(201).json({ message: 'Question and options added successfully!' });
    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Error adding question:', error);
        res.status(500).json({ error: 'Server error while adding question' });
    } finally {
        client.release(); 
    }
};

// @desc    Get all exams created by this teacher
const getTeacherExams = async (req, res) => {
    try {
        const teacher_id = req.user.id;
        const { rows } = await db.query('SELECT * FROM exams WHERE teacher_id = $1 ORDER BY created_at DESC', [teacher_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching teacher exams:', error);
        res.status(500).json({ error: 'Server error while fetching exams' });
    }
};

// @desc    Get results for a specific exam
const getExamResults = async (req, res) => {
    try {
        const { examId } = req.params;
        const teacher_id = req.user.id;

        const { rows: exams } = await db.query('SELECT id FROM exams WHERE id = $1 AND teacher_id = $2', [examId, teacher_id]);
        if (exams.length === 0) {
            return res.status(403).json({ error: 'Not authorized to view these results' });
        }

        const { rows: results } = await db.query(`
            SELECT r.id, r.score, r.total_questions, r.submitted_at, u.name as student_name, u.email as student_email
            FROM results r
            JOIN users u ON r.student_id = u.id
            WHERE r.exam_id = $1
            ORDER BY r.score DESC, r.submitted_at ASC
        `, [examId]);

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching exam results:', error);
        res.status(500).json({ error: 'Server error while fetching results' });
    }
};

// @desc    Add a remark
const addRemark = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { remarks } = req.body;
        await db.query('UPDATE results SET remarks = $1 WHERE id = $2', [remarks, resultId]);
        res.status(200).json({ message: 'Remark saved successfully' });
    } catch (error) {
        console.error('Error adding remark:', error);
        res.status(500).json({ error: 'Server error while saving remark' });
    }
};

// @desc    Get aggregate student records
const getStudentRecords = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT u.id, u.name, u.email, 
                   COUNT(r.id) as total_exams, 
                   ROUND(COALESCE(AVG((CAST(r.score AS FLOAT) / r.total_questions) * 100), 0)::numeric, 2) as average_score
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

const getComplaints = async (req, res) => {
    try {
        const { rows } = await db.query(`
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

const resolveComplaint = async (req, res) => {
    try {
        const { complaintId } = req.params;
        await db.query("UPDATE complaints SET status = 'resolved' WHERE id = $1", [complaintId]);
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

