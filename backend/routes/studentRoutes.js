// backend/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { getAvailableExams, getExamDetails, submitExam, getStudentResults, createComplaint, getStudentComplaints } = require('../controllers/studentController');
const { verifyToken, isStudent } = require('../middleware/authMiddleware');

// Apply middleware so ONLY logged-in students can access these routes
router.use(verifyToken, isStudent);

// GET /api/student/exams
router.get('/exams', getAvailableExams);

// GET /api/student/exams/:examId
router.get('/exams/:examId', getExamDetails);

// POST /api/student/exams/:examId/submit
router.post('/exams/:examId/submit', submitExam);

// GET /api/student/results
router.get('/results', getStudentResults);

// --- ADVANCED PHASE 2 ROUTES ---
router.post('/complaints', createComplaint);
router.get('/complaints', getStudentComplaints);

module.exports = router;
