// backend/controllers/studentController.js
const db = require('../db');

// @desc    Get all available exams
// @route   GET /api/student/exams
const getAvailableExams = async (req, res) => {
    try {
        // Fetch all exams from the database
        const [exams] = await db.query('SELECT id, title, subject, duration_minutes, created_at FROM exams ORDER BY created_at DESC');
        res.status(200).json(exams);
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ error: 'Server error while fetching exams' });
    }
};

// @desc    Get exam questions by ID (HIDING the correct answers!)
// @route   GET /api/student/exams/:examId
const getExamDetails = async (req, res) => {
    try {
        const { examId } = req.params;

        // 1. Get the exam details
        const [exams] = await db.query('SELECT * FROM exams WHERE id = ?', [examId]);
        if (exams.length === 0) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        const exam = exams[0];

        // 2. Get the questions
        const [questions] = await db.query('SELECT id, question_text FROM questions WHERE exam_id = ?', [examId]);

        // 3. For each question, attach its options
        // NOTE: Notice how we DO NOT select the 'is_correct' column.
        // If we send 'is_correct' to the frontend, tech-savvy students could cheat by inspecting the network response!
        for (let i = 0; i < questions.length; i++) {
            const [options] = await db.query(
                'SELECT id, option_text FROM options WHERE question_id = ?', 
                [questions[i].id]
            );
            questions[i].options = options;
        }

        res.status(200).json({
            exam: exam,
            questions: questions
        });
    } catch (error) {
        console.error('Error fetching exam details:', error);
        res.status(500).json({ error: 'Server error while fetching exam' });
    }
};

// @desc    Submit an exam and calculate the score
// @route   POST /api/student/exams/:examId/submit
const submitExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const studentId = req.user.id;
        const { answers } = req.body; 
        // Expected 'answers' format from frontend: { "questionId_1": "optionId_A", "questionId_2": "optionId_C", ... }

        // Fetch all questions to calculate total score
        const [questions] = await db.query('SELECT id FROM questions WHERE exam_id = ?', [examId]);
        const totalQuestions = questions.length;

        if (totalQuestions === 0) {
            return res.status(400).json({ error: 'This exam has no questions!' });
        }

        let score = 0;

        // Result calculation logic: Loop through the core questions and check their answers
        for (const q of questions) {
            const qId = q.id;
            const submittedOptionId = answers[qId];

            if (submittedOptionId) {
                // Check if the submitted option is indeed the correct one
                const [opts] = await db.query(
                    'SELECT is_correct FROM options WHERE id = ? AND question_id = ?', 
                    [submittedOptionId, qId]
                );
                
                if (opts.length > 0 && opts[0].is_correct === 1) {
                    score++;
                }
            }
        }

        // Save the score in the database
        const [result] = await db.query(
            'INSERT INTO results (student_id, exam_id, score, total_questions) VALUES (?, ?, ?, ?)',
            [studentId, examId, score, totalQuestions]
        );

        res.status(201).json({
            message: 'Exam submitted successfully!',
            score: score,
            total_questions: totalQuestions
        });

    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({ error: 'Server error while submitting exam' });
    }
};

// @desc    Get the student's result history
// @route   GET /api/student/results
const getStudentResults = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // Use a JOIN to attach the exam title and subject to the result data
        const [results] = await db.query(`
            SELECT r.id, r.score, r.total_questions, r.remarks, r.submitted_at, e.title, e.subject 
            FROM results r
            JOIN exams e ON r.exam_id = e.id
            WHERE r.student_id = ?
            ORDER BY r.submitted_at DESC
        `, [studentId]);

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Server error while fetching results' });
    }
};

// --- ADVANCED PHASE 2 METHODS ---
const createComplaint = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { subject, message } = req.body;
        await db.query('INSERT INTO complaints (student_id, subject, message) VALUES (?, ?, ?)', [studentId, subject, message]);
        res.status(201).json({ message: 'Complaint submitted successfully' });
    } catch (error) {
        console.error('Error creating complaint:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getStudentComplaints = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [complaints] = await db.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
        res.status(200).json(complaints);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getAvailableExams,
    getExamDetails,
    submitExam,
    getStudentResults,
    createComplaint,
    getStudentComplaints
};
