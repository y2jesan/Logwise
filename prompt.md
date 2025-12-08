# LOGWISE AI – MVP PROJECT GENERATION PROMPT

Create a complete working MVP of **LogWise AI – Error Detection & Resolver Tool** as a **JavaScript monorepo** with the following structure, technologies, and features.

---

# 🏗️ MONOREPO STRUCTURE

Root project:

- `/client` → React app (Vite, Tailwind, Shadcn UI, React Router, Zustand)
- `/api` → Node.js + Express backend
- `/shared` → Shared utils (types, constants)

The project must be installable with:

- `npm install` from root
- Start commands:
  - `npm run dev:client`
  - `npm run dev:api`
  - `npm run dev` → runs both concurrently

---

# 🌐 FRONTEND — `/client`

## Framework

- React + Vite
- React Router
- Zustand for global state
- TailwindCSS
- Shadcn UI components installed and configured

## Routes

- `/` → Landing page

  - Hero section explaining LogWise AI
  - Cards describing 5 features:
    1. AI Log Analyzer
    2. AI Alerting System
    3. Smart Uptime Monitor
    4. API Performance Watcher
    5. Dashboard + History
  - Buttons: **Login** / **Go to Dashboard** (if authenticated)

- `/login`

  - Email/password login
  - Uses backend session/JWT

- `/dashboard` (protected)

  - Show:
    - System uptime
    - Performance data
    - Recent errors (fetched from backend)
    - AI summaries (from backend)
  - Sidebar with:
    - Dashboard
    - Logs
    - Services
    - Settings (Admin only)

- `/settings` (protected)
  - Configure:
    - Telegram Bot Token
    - Telegram Chat/Group ID
    - Save to MongoDB
    - Test notification button (Make Test Notification for different kinds of errors and situations)
  - Backend endpoint: `POST /api/settings/save`

## Authentication

- JWT-based auth
- Token stored in httpOnly cookie
- Global Zustand store: user, login, logout
- Auto-redirect on token expiry

---

# 🖥️ BACKEND — `/api`

## Stack:

- Node.js
- Express
- MongoDB (Mongoose)
- Dotenv
- Cookie-parser
- Gorq AI API
- Telegram Bot API
- CORS enabled for client

## ENV Variables

PORT=4000
MONGO_URI=
JWT_SECRET=
GROQ_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_GROUP_ID=

## API Endpoints

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Settings (Admin)

- `GET /api/settings`
- `POST /api/settings`
  - Save telegram bot_id, group_id, thresholds

### Logs + AI

- `POST /api/logs/analyze`
  - Input: raw log text
  - Process:
    1. Extract relevant lines
    2. Send to Groq AI model (Llama 3 or Mixtral)
    3. Generate:
       - summary
       - root cause
       - fix suggestion
    4. Return JSON
- `POST /api/logs/push`
  - Push logs from any app (external integration)
  - Save to MongoDB
  - Auto-run AI summarizer
  - If severity = high → send Telegram alert

### Services

- `GET /api/services/status`
  - Ping all registered services
  - If down → send Telegram alert
  - AI determines probable cause

### Performance

- `GET /api/performance/check`
  - Tracks response time of API endpoints
  - If threshold exceeded → AI suggestion + Telegram message

---

# 🤖 AI INTEGRATION (GROQ)

Use Groq API via `@groq/sdk` or fetch-compatible endpoint.

AI Tasks:

1. Log summarization
2. Root cause analysis
3. Severity classification
4. Fix suggestion (human readable)
5. Code patch suggestion (not mandatory for MVP)

Prompt Template Example:
You are LogWise AI. Analyze this application log and return:

Summary
Cause
Severity (info/warning/critical)
Fix recommendation
Potential code patch (if applicable)
LOG: {{log_text}}

# 📩 TELEGRAM INTEGRATION

Use Telegram Bot API via `node-fetch`.

Send message function:
POST https://api.telegram.org/bot${BOT_TOKEN}/sendMessage

Triggered when:

- Critical error found
- Service down
- API too slow
- AI finds high-risk log pattern

---

# 📊 DATABASE (MongoDB)

Create these collections:

### `users`

- email
- password (hashed)
- role ("admin" / "user")

### `settings`

- telegramBotToken
- telegramGroupId
- thresholds
- createdAt

### `logs`

- text
- summary
- cause
- severity
- fix
- aiRaw
- createdAt

### `services`

- name
- url
- status
- lastChecked

---

# Postman.JSON file for documentation

- Proper Documentation for postman to integrate all the endpoints and features

---

# 🧪 OPTIONAL (But Good for MVP)

- Seed script for admin user - MUST
  Email: admin@example.com
  Password: admin123
- Dummy log generated
- Example API monitoring list
- Test AI analysis commands

---

# 🎯 FINAL OUTPUT REQUIREMENTS

The agent must generate:

✔ Full monorepo folder structure  
✔ Complete working `/client` React project  
✔ Complete working `/api` Express app  
✔ All required pages & routes  
✔ All required backend routes  
✔ Mongoose models  
✔ Groq AI integration  
✔ Telegram notification integration  
✔ Auth (JWT)  
✔ Dashboard UI with dummy data  
✔ Tailwind + Shadcn configured  
✔ Example .env file  
✔ README.md with run instructions

The output must be a **fully runnable project**.

---

# END OF PROMPT
