// frontend/js/auth.js
// Handles Login and Registration logic via the browser's Fetch API

// NOTE: The backend runs on a different port (e.g. 5000), so we use the full localhost URL.
const API_URL = 'http://localhost:5000/api/auth';

// Utility helper to show success/error messages in the UI
function showMessage(text, isError = false) {
    const msgBox = document.getElementById('messageBox');
    if (!msgBox) return; 
    
    msgBox.textContent = text;
    msgBox.className = 'message ' + (isError ? 'error' : 'success');
}

// ------------------------------------
// REGISTRATION LOGIC
// ------------------------------------
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        // Prevent default browser form submission (which triggers a page refresh)
        e.preventDefault();
        
        // Grab values from inputs
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        try {
            // Send HTTP POST request to the backend with JSON data
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            // If status is not 2xx, throw an error
            if (!response.ok) throw new Error(data.error || 'Registration failed');

            showMessage('Registration successful! Redirecting to login...', false);
            
            // Redirect to login page after 1.5 seconds
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);

        } catch (error) {
            console.error('Registration Error:', error);
            showMessage(error.message, true);
        }
    });
}

// ------------------------------------
// LOGIN LOGIC
// ------------------------------------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Login failed');

            showMessage('Authentication successful. Initializing dashboard...', false);
            
            // NOTE: Security Best Practice! 
            // We store the Web Token in localStorage so we can use it to securely access dashboards.
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);

            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'teacher') {
                    window.location.href = 'teacher-dashboard.html';
                } else {
                    window.location.href = 'student-dashboard.html';
                }
            }, 1000);

        } catch (error) {
            console.error('Login Error:', error);
            showMessage(error.message, true);
        }
    });
}

// NOTE: Auto-redirect if already logged in!
// Check if the user ALREADY has a token right when the page loads.
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    // Are we currently on the login or register page?
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.endsWith('index.html') || currentPath.endsWith('register.html') || currentPath === '/';
    
    if (token && isAuthPage) {
        if (role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else if (role === 'student') {
            window.location.href = 'student-dashboard.html';
        }
    }
});
