# Complete Deployment Guide 🚀

To make this 100% free and easy, we are going to deploy the **entire application** (Frontend + Backend) onto **Render**, and we will host the MySQL Database on **Aiven** (or Clever Cloud).

## Step 1: Push your latest code
All configuration changes have been pushed to GitHub using `git push`. Check your GitHub repository to ensure the latest `"Prep for deployment"` commit is there.

---

## Step 2: Set up the Cloud Database
We need a cloud database since `localhost` only exists on your computer.

1. Go to [Aiven.io](https://aiven.io/) and create a free account (or try Clever-Cloud or TiDB).
2. Create a Free MySQL Service.
3. Once the database finishes creating, they will give you the **Connection URI** or individual parameters (Host, Port, User, Password).
4. Run your `schema.sql` code in their provided SQL console (or connect via MySQL Workbench) to generate the tables in the cloud.

---

## Step 3: Deploy the Server
Since we configured the Node.js backend to serve the frontend static files (`app.use('/', express.static...)`), we only need to deploy the backend!

1. Go to [Render.com](https://render.com/) and create a free account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub account and select your `online-exam-system` repository.
4. Fill in the following settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   
5. Scroll down to **Environment Variables**, and add the variables from your local `.env` file!
   - `PORT`: (Leave blank, Render handles this)
   - `DB_HOST`: [Your Cloud DB Host URL]
   - `DB_USER`: [Your Cloud DB Username]
   - `DB_PASSWORD`: [Your Cloud DB Password]
   - `DB_NAME`: [Your Cloud DB Name]

6. Click **Deploy Web Service**!

## Step 4: Access your Live Site
Render will take a minute or two to build and boot up your server. Once it succeeds, they will give you a live URL (e.g. `https://online-exam-system.onrender.com`). 

Click that URL, and your fully functioning full-stack SaaS application is live on the internet!
