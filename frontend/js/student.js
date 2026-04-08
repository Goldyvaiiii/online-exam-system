// frontend/js/student.js
const API_URL = '/api/student';

// Validate their passcard (JWT Token)
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('userRole');
const userName = localStorage.getItem('userName');

if (!token || userRole !== 'student') {
    // Intruders are kicked to the login screen!
    window.location.href = 'index.html';
}

// GUI Hydration
document.getElementById('userNameDisplay').textContent = `Welcome, ${userName || 'Operative'}`;
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// UI Panel Switching
const menuBtns = document.querySelectorAll('.menu-btn');
const panels = document.querySelectorAll('.panel');

menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        menuBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });

        btn.classList.add('active');
        const targetSection = document.getElementById(btn.getAttribute('data-target'));
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');

        // Refresh data every time a tab is clicked!
        if (targetSection.id === 'available-exams') loadAvailableExams();
        if (targetSection.id === 'my-results') loadMyResults();
    });
});

async function loadAvailableExams() {
    try {
        const res = await fetch(`${API_URL}/exams`, { headers: { 'Authorization': `Bearer ${token}` } });
        const exams = await res.json();
        
        const examsList = document.getElementById('examsList');
        examsList.innerHTML = ''; 

        if (exams.length === 0) {
            examsList.innerHTML = '<p style="color: var(--text-secondary)">No modules currently deployed.</p>';
            return;
        }

        exams.forEach(exam => {
            const card = document.createElement('div');
            card.className = 'exam-card';
            card.innerHTML = `
                <h3>${exam.title}</h3>
                <p><strong>Subject Segment:</strong> ${exam.subject}</p>
                <p><strong>Allotted Time:</strong> ${exam.duration_minutes} mins</p>
                <button class="action-btn mt-1" onclick="startExam(${exam.id})">Initiate Sequence →</button>
            `;
            examsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

// A simple global function triggered by inline HTML to transition the user to the testing environment
window.startExam = (examId) => window.location.href = `exam.html?id=${examId}`;

async function loadMyResults() {
    try {
        const res = await fetch(`${API_URL}/results`, { headers: { 'Authorization': `Bearer ${token}` } });
        const results = await res.json();
        
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = ''; 

        if (results.length === 0) {
            resultsList.innerHTML = '<p style="color: var(--text-secondary)">No analytics recorded yet.</p>';
            return;
        }

        results.forEach(r => {
            // Note: Simple percentage calculation
            const percentage = Math.round((r.score / r.total_questions) * 100);
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <p><strong>Module:</strong> ${r.title} | ${r.subject}</p>
                <p class="result-score" style="font-size: 1.1rem; margin-top: 5px;">Integrity Match: ${r.score} / ${r.total_questions} (${percentage}%)</p>
                <p><small style="color: var(--text-secondary);">Processed: ${new Date(r.submitted_at).toLocaleString()}</small></p>
            `;
            resultsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

// Auto fire on load
loadAvailableExams();
