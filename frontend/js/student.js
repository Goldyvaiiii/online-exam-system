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
        if (targetSection.id === 'lodge-complaint') loadMyComplaints();
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
                <p><strong>Exam:</strong> ${r.title} | ${r.subject}</p>
                <p class="result-score" style="font-size: 1.1rem; margin-top: 5px;">Score: ${r.score} / ${r.total_questions} (${percentage}%)</p>
                <p><small style="color: var(--text-secondary);">Processed: ${new Date(r.submitted_at).toLocaleString()}</small></p>
                ${r.remarks ? `<div style="margin-top:1rem; padding:0.8rem; background:#eff6ff; border-left:4px solid var(--accent-glow); border-radius:6px;"><strong style="color:var(--text-primary);">📝 Teacher Remark:</strong><br>${r.remarks}</div>` : ''}
            `;
            resultsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

// Auto fire on load
loadAvailableExams();

// --- ADVANCED PHASE 2 ---
async function loadMyComplaints() {
    try {
        const res = await fetch(`${API_URL}/complaints`, { headers: { 'Authorization': `Bearer ${token}` }});
        const data = await res.json();
        const container = document.getElementById('myComplaintsList');
        container.innerHTML = '';
        if(data.length===0) return container.innerHTML='<p>No tickets sent.</p>';
        data.forEach(c => {
            const statusColor = c.status === 'resolved' ? 'var(--success-color)' : '#d97706';
            container.innerHTML += `<div class="result-card">
                <p><strong>Subject:</strong> ${c.subject}</p>
                <p style="margin: 0.5rem 0;">${c.message}</p>
                <p><small>Status: <strong style="color:${statusColor}">${c.status.toUpperCase()}</strong></small></p>
            </div>`;
        });
    } catch(e) { console.error(e); }
}

document.getElementById('complaintForm')?.addEventListener('submit', async(e) => {
    e.preventDefault();
    const subject = document.getElementById('cSubject').value;
    const message = document.getElementById('cMessage').value;
    try {
        await fetch(`${API_URL}/complaints`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, message })
        });
        e.target.reset();
        loadMyComplaints();
        alert('Ticket submitted successfully! Teachers have been notified.');
    } catch(err) { alert('Error submitting ticket'); }
});
