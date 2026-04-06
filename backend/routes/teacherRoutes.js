// backend/routes/teacherRoutes.js
// This file handles all routes specific to the teacher dashboard.

const express = require('express');
const router = express.Router();
const { createExam, addQuestion, getTeacherExams, getExamResults } = require('../controllers/teacherController');

// Import our security middleware
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');

// Apply middleware to ALL routes in this file!
// This means every route below will first check if the user is a logged-in teacher.
router.use(verifyToken, isTeacher);

// POST /api/teacher/exams -> Create a new exam
router.post('/exams', createExam);

// GET /api/teacher/exams -> Get all exams for the logged-in teacher
router.get('/exams', getTeacherExams);

// POST /api/teacher/exams/:examId/questions -> Add a new question to an exam
router.post('/exams/:examId/questions', addQuestion);

// GET /api/teacher/exams/:examId/results -> Fetch student scores
router.get('/exams/:examId/results', getExamResults);

module.exports = router;
