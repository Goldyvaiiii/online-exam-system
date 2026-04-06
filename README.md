# Online Exam System - Beginner Friendly 🚀

Welcome to the Online Exam System! This full-stack web application is built strictly using **Vanilla JS, HTML, CSS** for the frontend, and **Node.js, Express, MySQL** for the backend. No complex frameworks or abstractions were used so you can easily trace how data flows from your database to the frontend!

---

## 🌟 Features
- **Teacher Perspective**: Secure login, create customized timed exams, inject MCQ questions, and effortlessly view automated analytics of their student's test scores.
- **Student Perspective**: View globally deployed exams, take live exams with a stressful animated countdown timer, experience a satisfying one-question-at-a-time modern UI, and get heavily-guarded immediate percentage grades.
- **Security**: JWT tokens are deployed logically and manually stored in `localStorage`, functioning as secure passcards to access protected API endpoints.
- **Aesthetic**: Deep dark mode, animated CSS glowing orbs, frosted glassmorphism elements natively built with raw CSS rules.

---

## 🛠 Prerequisites
You need **Node.js** and **MySQL** installed locally.

## 🚀 Setup Steps

### 1. Database Initialization
1. Open your MySQL client (e.g., MySQL Workbench, XAMPP, or the CLI).
2. Create the system database: `CREATE DATABASE online_exam;`
3. Load the instructions located inside the `schema.sql` file to successfully forge the necessary tables into your database.

### 2. Backend Initialization
1. Open your IDE's terminal and dive into the backend directory: `cd backend`
2. Install the necessary web engines: `npm install`
3. Inject your environments: In the `.env` file, ensure `DB_PASSWORD` accurately reflects your local MySQL root password.
4. Ignite the server: `node server.js`

### 3. Frontend Initialization
1. To view your beautiful pages interactively, use a basic HTTP server.
2. In VS Code, simply install **Live Server**.
3. Right click `frontend/index.html` and choose **Open with Live Server**.
4. The matrix will load! Ensure the node.js server is actively running in the background so the APIs hook up successfully.

---

### 🧠 Developer Notes for Beginners:
- **`authMiddleware.js`**: Notice how JWT elegantly intercepts incoming network requests, blocks attackers lacking passports (`401`), and permits active operatives.
- **Transactions (`teacherController.js`)**: Be sure to study `addQuestion()`. Using `.beginTransaction()` effectively guards the integrity of your database. If inserting Options fails, the Question creation automatically rolls back!
