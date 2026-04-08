// frontend/js/exam.js
// Handles LIVE exam logic, pagination, and count-down timers!

const API_URL = '/api/student';
const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

// Grab the specific exam 'id' straight from the URL parameters
// e.g. exam.html?id=5
const urlParams = new URLSearchParams(window.location.search);
const examId = urlParams.get('id');

// Global state variables for the lively interactive exam environment
let examData = null;
let currentQIndex = 0;
let userAnswers = {}; // Keep track of multiple choice selections as: { "questionId": "optionId" }
let timeRemaining = 0;
let timerInterval;

// Start initialization!
async function bootstrapExam() {
    try {
        const res = await fetch(`${API_URL}/exams/${examId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        examData = data;
        document.getElementById('examTitleNav').textContent = data.exam.title;
        document.getElementById('qContainer').style.display = 'block';

        // Timer starts! convert minutes to explicit seconds
        timeRemaining = data.exam.duration_minutes * 60; 
        startTimer();

        // Render the very first question!
        renderQuestion();
    } catch (err) {
        alert("System Malfunction: " + err.message);
        window.location.href = 'student-dashboard.html';
    }
}

// ------------------------------------
// TIMER LOGIC 
// ------------------------------------
function startTimer() {
    const timerEl = document.getElementById('timer');
    
    // Fire this arrow function every 1000ms (1 second)
    timerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            // CRITICAL: Auto submit if time runs out! User instruction!
            submitExamSequence();
            return;
        }
        
        timeRemaining--;
        const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const secs = (timeRemaining % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
        
        // Critical time warning (under 1 min), triggers CSS animation in exam.html!
        if (timeRemaining < 60) {
            timerEl.style.animation = 'pulse 0.5s infinite alternate';
        }
    }, 1000);
}

// ------------------------------------
// ONE-BY-ONE UI LOGIC 
// ------------------------------------
function renderQuestion() {
    const q = examData.questions[currentQIndex];
    document.getElementById('qCounter').textContent = `Evaluating segment ${currentQIndex + 1} of ${examData.questions.length}`;
    document.getElementById('qText').textContent = q.question_text;

    const optionsWrapper = document.getElementById('optionsWrapper');
    optionsWrapper.innerHTML = ''; // wipe old choices

    // Map through array to inject HTML
    q.options.forEach(opt => {
        const label = document.createElement('label');
        label.className = 'option-label';
        
        // Check our dictionary to see if the user previously clicked this when jumping between Prev/Next!
        const isChecked = userAnswers[q.id] == opt.id ? 'checked' : '';
        
        label.innerHTML = `
            <input type="radio" name="optRadio" value="${opt.id}" ${isChecked}>
            ${opt.option_text}
        `;
        
        // Save answers in JS memory immediately upon clicking
        label.querySelector('input').addEventListener('change', (e) => {
            userAnswers[q.id] = parseInt(e.target.value);
        });

        optionsWrapper.appendChild(label);
    });

    // Handle Pagination visibility
    document.getElementById('prevBtn').style.display = currentQIndex === 0 ? 'none' : 'block';
    
    if (currentQIndex === examData.questions.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'block'; // Only visible at the end!
    } else {
        document.getElementById('nextBtn').style.display = 'block';
        document.getElementById('submitBtn').style.display = 'none';
    }
}

// Button Events
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentQIndex > 0) { currentQIndex--; renderQuestion(); }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentQIndex < examData.questions.length - 1) { currentQIndex++; renderQuestion(); }
});

document.getElementById('submitBtn').addEventListener('click', submitExamSequence);

// ------------------------------------
// SUBMIT DATA LOGIC 
// ------------------------------------
async function submitExamSequence() {
    clearInterval(timerInterval); // Stop countdown clock
    
    // Remove UI immediately so they can't change anything
    document.getElementById('qContainer').innerHTML = "<h2 style='text-align:center;'>Transmitting dataset back to Central Nexus...</h2>";

    try {
        const res = await fetch(`${API_URL}/exams/${examId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers: userAnswers }) // Send the dictionary
        });
        const resultData = await res.json();
        
        if (!res.ok) throw new Error(resultData.error);

        // Security NOTE: It's hard to securely pass backend data rapidly between HTML pages. 
        // Using sessionStorage is perfect because it gets wiped when the user closes the tab!
        sessionStorage.setItem('lastResult', JSON.stringify(resultData));
        window.location.href = 'result.html';

    } catch (err) {
        alert("Submission failure code: " + err.message);
        window.location.href = 'student-dashboard.html';
    }
}

// Initialize boot sequence!
bootstrapExam();
