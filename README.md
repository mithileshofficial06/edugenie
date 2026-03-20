<p align="center">
  <img src="https://img.shields.io/badge/EDUGENIE-AI%20Academic%20Intelligence-8b5cf6?style=for-the-badge&labelColor=0a0a0a" alt="EduGenie" />
</p>

<h1 align="center">🧞 EduGenie</h1>

<p align="center">
  <strong>Auto-monitors your Moodle · Generates AI study material · Delivers via Email + WhatsApp</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-Flask-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Mistral%20%7C%20Gemini-FF6F00?style=flat-square" />
  <img src="https://img.shields.io/badge/WhatsApp-Twilio-25D366?style=flat-square&logo=whatsapp&logoColor=white" />
</p>

---

## 💡 What is EduGenie?

EduGenie is an **AI-powered academic assistant** that connects to your college Moodle LMS and works for you 24/7:

1. 🔍 **Monitors** your Moodle courses every 2 hours for new assignments, quizzes, and resources
2. 🤖 **Generates** mock question banks and study documents using AI (Mistral / Gemini)
3. 📧 **Emails** you beautifully formatted study material
4. 📱 **Alerts** you on WhatsApp with concise notifications and deadline reminders

> **You register once. EduGenie does the rest.**

---

## 🏗️ Architecture

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend     │────▶│    Backend       │────▶│  AI Service  │
│  React + Vite  │     │  Express + Cron  │     │ Flask + AI   │
│  Port 5173     │     │  Port 3000       │     │ Port 5001    │
└────────────────┘     └────────┬─────────┘     └──────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌──────────┐ ┌────────┐ ┌──────────┐
              │ MongoDB  │ │ Twilio │ │  Gmail   │
              │  Atlas   │ │WhatsApp│ │  SMTP    │
              └──────────┘ └────────┘ └──────────┘
```

---

## ✨ Features

### 📡 Moodle Integration
- Auto-syncs with your Moodle every 2 hours
- Detects new assignments, quizzes, and uploaded resources
- Smart semester-based course filtering
- Token validation with auto-deactivation on expiry

### 🤖 AI Content Generation
- **Mock Question Banks** — 10 practice MCQs per quiz (with answers + explanations)
- **Study Documents** — structured notes with key concepts, examples, and practice questions
- **Dual AI provider** — Mistral AI (primary) + Google Gemini (fallback)
- Switchable via `.env` — `AI_PROVIDER=mistral` or `AI_PROVIDER=gemini`
- PDF text extraction from Moodle resources for context-aware generation

### 📧 Email Delivery
- 4 dark-themed HTML email templates (Welcome, Quiz, Assignment, Notes)
- Clean markdown-to-HTML conversion — no raw `##` or `**` in emails
- Retry mechanism with exponential backoff

### 📱 WhatsApp Alerts
- Instant alerts for new assignments, quizzes, and resources
- **"Study material sent to email"** notifications
- Multi-tier deadline reminders: **3 days → 1 day → 2 hours**
- Twilio sandbox renewal reminders (72-hour cycle)

### 🎨 Frontend
- Brutalist dark design with neon accents
- Particle background + Framer Motion animations
- Step-by-step guides for Moodle token & WhatsApp setup
- Fully responsive

---

## 📁 Project Structure

```
edugenie/
├── frontend/               # React + Vite + Tailwind + Framer Motion
│   └── src/
│       ├── App.jsx          # Main app — registration form + landing page
│       └── components/      # ParticleBackground, etc.
│
├── backend/                 # Node.js + Express
│   ├── index.js             # Server entry + scheduler start
│   ├── models/              # Student, Assignment schemas
│   ├── routes/              # /api/register, /api/debug
│   └── services/
│       ├── scheduler.js     # Main pipeline (runs every 2hrs)
│       ├── aiService.js     # AI service client + Gemini fallback
│       ├── emailService.js  # 4 HTML email templates
│       ├── whatsappService.js # Twilio WhatsApp messaging
│       ├── moodleService.js # Moodle API integration
│       ├── pdfService.js    # PDF text extraction
│       ├── assignmentDetector.js # New item detection
│       └── contentClassifier.js  # Content classification
│
├── ai/                      # Python Flask microservice
│   ├── app.py               # Flask server (port 5001)
│   ├── ai_provider.py       # Unified AI provider (Mistral + Gemini)
│   ├── question_generator.py # MCQ generation prompts
│   └── doc_generator.py     # Study document generation prompts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+
- **MongoDB Atlas** account
- **Twilio** account (for WhatsApp)
- **Gmail** app password
- **Mistral AI** or **Google Gemini** API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/edugenie.git
cd edugenie
```

### 2. Setup AI Service

```bash
cd ai
pip install -r requirements.txt
```

Create `ai/.env`:
```env
AI_PROVIDER=mistral
MISTRAL_API_KEY=your_mistral_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
MOODLE_URL=https://moodle.yourschool.edu
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
GEMINI_API_KEY=your_gemini_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
POLLING_INTERVAL=2
FRONTEND_URL=http://localhost:5173
```

### 4. Setup Frontend

```bash
cd frontend
npm install
```

### 5. Run All Services

```bash
# Terminal 1 — AI Service
cd ai && python app.py

# Terminal 2 — Backend
cd backend && node index.js

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and register!

---

## 🔄 How the Pipeline Works

```
Student Registers
      ↓
Scheduler Runs (every 2 hours)
      ↓
Fetches courses from Moodle
      ↓
Detects new quizzes / assignments / resources
      ↓
Extracts PDF notes (if available)
      ↓
Generates AI content (MCQs or Study Docs)
      ↓
Sends formatted email + WhatsApp alerts
      ↓
Tracks deadlines → Sends reminders (3d → 1d → 2h)
```

---

## 🧪 Testing

```bash
# Test AI generation pipeline
cd backend && node testAI.js "Operating System"

# Test full email + WhatsApp delivery
cd backend && node testEmailPipeline.js
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Framer Motion |
| **Backend** | Node.js, Express 5, Mongoose, node-cron |
| **AI Service** | Python, Flask, Mistral AI, Google Gemini |
| **Database** | MongoDB Atlas |
| **Messaging** | Twilio (WhatsApp), Nodemailer (Gmail SMTP) |
| **Deployment** | Netlify (frontend), Railway (backend) |

---

## 🔮 Roadmap

- [ ] Cloud deployment (Railway + Render) for 24/7 operation
- [ ] Student dashboard with generated materials archive
- [ ] `.docx` file support for text extraction
- [ ] Assignment submission tracking
- [ ] Multi-institution support
- [ ] Auto-fallback between AI providers based on quota

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>EduGenie</strong> — Built for students who refuse to fall behind.
</p>
