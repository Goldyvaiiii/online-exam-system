// frontend/js/teacher.js
// Handles all API interactions in the Teacher Dashboard

const API_URL = '/api/teacher';

// Retrieve credentials from localStorage
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('userRole');
const userName = localStorage.getItem('userName');

// ------------------------------------
// SECURITY: Check Authorization early
// ------------------------------------
// If they have no token or aren't actually a teacher, kick them to login!
if (!token || userRole !== 'teacher') {
    window.location.href = 'index.html';
}

// ------------------------------------
// UI INITIALIZATION
// ------------------------------------
document.getElementById('userNameDisplay').textContent = `Welcome, ${userName || 'Teacher'}`;

// Handle Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
});

// Helper for temporary UI messages
function showMessage(text, isError = false) {
    const msgBox = document.getElementById('messageBox');
    msgBox.style.display = 'block';
    msgBox.textContent = text;
    msgBox.className = 'message ' + (isError ? 'error' : 'success');
    
    // Auto hide the box after 4 seconds
    setTimeout(() => { msgBox.style.display = 'none'; }, 4000);
}

// ------------------------------------
// DASHBOARD TABS NAVIGATION LOGIC
// ------------------------------------
const menuBtns = document.querySelectorAll('.menu-btn');
const panels = document.querySelectorAll('.panel');

menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Clear active highlighting from all buttons and panels
        menuBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('active');
        });

        // Set the clicked button as active
        btn.classList.add('active');
        
        // Find the panel that corresponds to the data-target string and show it
        const targetSectionId = btn.getAttribute('data-target');
        const targetSection = document.getElementById(targetSectionId);
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');

        // Note: Hide the message box so old messages don't persist between tabs
        document.getElementById('messageBox').style.display = 'none';

        // Refresh exams auto-magically if the teacher clicks the first tab
        if (targetSection.id === 'view-exams') {
            loadExams();
        }
    });
});

// ------------------------------------
// LOAD & RENDER TEACHER EXAMS
// ------------------------------------
async function loadExams() {
    try {
        // Make sure to securely pass in the JWT token
        const res = await fetch(`${API_URL}/exams`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const exams = await res.json();
        
        const examsList = document.getElementById('examsList');
        examsList.innerHTML = ''; // Clear out the grid

        if (exams.length === 0) {
            examsList.innerHTML = '<p style="color: var(--text-secondary)">No exams deployed yet.</p>';
            return;
        }

        // Generate the visual "cards" for each exam
        exams.forEach(exam => {
            const card = document.createElement('div');
            card.className = 'exam-card';
            card.innerHTML = `
                <h3>${exam.title}</h3>
                <p><strong>Subject:</strong> ${exam.subject}</p>
                <p><strong>Duration:</strong> ${exam.duration_minutes} mins</p>
                <p><small>Created: ${new Date(exam.created_at).toLocaleDateString()}</small></p>
                
                <!-- Notice how the id and title are directly encoded into the button's click event logic: -->
                <button class="action-btn" onclick="openExamManager(${exam.id}, '${exam.title}')">Manage Modules</button>
            `;
            examsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        showMessage('Failed to load exams from server', true);
    }
}

// Automatically load the exams when the script runs for the first time
loadExams();

// ------------------------------------
// CREATE NEW EXAM FORM
// ------------------------------------
document.getElementById('createExamForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page refresh!

    const title = document.getElementById('examTitle').value.trim();
    const subject = document.getElementById('examSubject').value.trim();
    const duration_minutes = document.getElementById('examDuration').value;

    try {
        const res = await fetch(`${API_URL}/exams`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, subject, duration_minutes })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showMessage(data.message);
        e.target.reset(); // clear input boxes
        
        // Emulate clicking the first tab button to send them back to the list of exams
        menuBtns[0].click(); 
    } catch (err) {
        showMessage(err.message, true);
    }
});


// ------------------------------------
// EXAM MANAGER (VIEW RESULTS / ADD Qs)
// ------------------------------------

// Keep track of which exam we are deeply investigating
let currentExamId = null;

// This function is triggered by clicking the blue "Manage Modules" button in an exam card
window.openExamManager = (examId, examTitle) => {
    currentExamId = examId;
    document.getElementById('managerExamTitle').textContent = `System Focus: ${examTitle}`;
    
    // Hide default panels completely
    panels.forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
    menuBtns.forEach(b => b.classList.remove('active'));
    
    // Explicitly show the 3rd hidden manager sub-panel
    const managerPanel = document.getElementById('exam-manager');
    managerPanel.classList.remove('hidden');
    managerPanel.classList.add('active');

    // Automatically retrieve test results for this exam
    loadExamResults(examId);
};

// Handle back button inside exam manager
document.getElementById('backToExams').addEventListener('click', () => {
    currentExamId = null;
    menuBtns[0].click(); // Simulate clicking the first tab to return to safety
});

// Append New Question action
document.getElementById('addQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentExamId) return;

    // Grab exactly which radio choice (0, 1, 2, or 3) was selected
    const correctVal = document.querySelector('input[name="correctOpt"]:checked').value;
    
    // Structure the data perfectly for the backend transaction
    const options = [
        { text: document.getElementById('opt0').value.trim(), isCorrect: correctVal === '0' },
        { text: document.getElementById('opt1').value.trim(), isCorrect: correctVal === '1' },
        { text: document.getElementById('opt2').value.trim(), isCorrect: correctVal === '2' },
        { text: document.getElementById('opt3').value.trim(), isCorrect: correctVal === '3' }
    ];

    const question_text = document.getElementById('qText').value.trim();

    try {
        const res = await fetch(`${API_URL}/exams/${currentExamId}/questions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question_text, options })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showMessage(data.message);
        e.target.reset(); // Clear the form so the teacher can efficiently type the next question!

    } catch (err) {
        showMessage(err.message, true);
    }
});

// Download and display Student Scores for specific exam
async function loadExamResults(examId) {
    try {
        const res = await fetch(`${API_URL}/exams/${examId}/results`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const results = await res.json();
        
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = ''; 

        if (results.length === 0) {
            resultsList.innerHTML = '<p style="color: var(--text-secondary)">No submissions collected yet.</p>';
            return;
        }

        results.forEach(r => {
            const div = document.createElement('div');
            div.className = 'result-card';
            div.innerHTML = `
                <p><strong>Operative:</strong> ${r.student_name} (${r.student_email})</p>
                <p class="result-score">Integrity Score: ${r.score} / ${r.total_questions}</p>
                <p><small>Time: ${new Date(r.submitted_at).toLocaleString()}</small></p>
            `;
            resultsList.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        document.getElementById('resultsList').innerHTML = '<p class="error">Failed to receive analytics uplink</p>';
    }
}
