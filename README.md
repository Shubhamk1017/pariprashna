# 🙏 Pariprashna — A Temple of Verified Hindu Knowledge

**Pariprashna** (परिप्रश्न) is a full-stack Q&A platform for Hinduism, Sanatan Dharma, and Vedic philosophy. It combines community-driven answers from verified Gurus and Scholars with AI-powered responses backed by real shlokas from [vedabase.io](https://vedabase.io).

> *"tad viddhi praṇipātena paripraśnena sevayā"*
> — Bhagavad Gita 4.34

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend** | [https://pariprashna.vercel.app](https://pariprashna.vercel.app) |
| **Backend API** | [https://pariprashna-api.onrender.com](https://pariprashna-api.onrender.com) |
| **API Health Check** | [https://pariprashna-api.onrender.com/api/health](https://pariprashna-api.onrender.com/api/health) |
| **Database** | MongoDB Atlas (Cloud) |
| **GitHub Repository** | [github.com/your-username/Pariprashna](https://github.com/your-username/Pariprashna) |

> ⚠️ **Update the URLs above** with your actual deployment links after following the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## ✨ Features

### Core Q&A
- Ask and answer questions with full **Markdown support**
- **Upvote/Downvote** system for community curation
- **Comments** on questions and answers
- **Tags** for topic categorization (auto-tagging supported)
- **Full-text search** and filtering
- **Bounties** — offer reputation points for faster answers

### Guru/Scholar Verification System
- **Three-tier expert hierarchy:** Scholar → Guru → Acharya
- Dedicated **Guru Portal** with verification dashboard
- **"Guru Verified"** badge on verified answers
- Self-verification prevention

### AI Scripture Assistant
- **Dual AI** — Groq (Llama 3.1) as primary, Google Gemini as fallback
- **RAG pipeline** — searches vedabase.io scripture database for real shlokas
- Auto-generates answers with **Sanskrit text, transliteration, and translation**
- AI answers require **Admin verification** before public visibility
- Conversational **AI Chat** with session history and feedback

### Authentication & Security
- **Google OAuth** login
- **JWT-based** session management (7-day expiry)
- **Role-based access control** — User, Scholar, Guru, Acharya, Admin
- **Rate limiting** on all API routes
- **CORS** restricted to frontend domain
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

### Additional Features
- **Command Palette** (⌘K / Ctrl+K) for quick navigation
- **Dark mode** support
- **WhatsApp integration** — new questions posted to WhatsApp group
- **Review queues** for content moderation
- **User profiles** with reputation, badges, and activity history
- **Daily Shloka** on homepage (rotating Bhagavad Gita verses)
- **Code-split** React routes for performance

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS 3, React Router 6 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **AI (Primary)** | Groq — Llama 3.1 8B Instant |
| **AI (Fallback)** | Google Gemini 1.5 Flash |
| **Scripture Data** | vedabase.io corpus in MongoDB (RAG) |
| **Authentication** | JWT + Google OAuth 2.0 (Passport.js) |
| **Hosting** | Vercel (frontend) + Render (backend) |
| **WhatsApp** | whatsapp-web.js |

---

## 📁 Project Structure

```
Pariprashna/
├── client/                      # React frontend
│   ├── public/
│   │   ├── index.html           # HTML entry point with SEO meta tags
│   │   ├── sitemap.xml          # SEO sitemap
│   │   └── robots.txt           # Crawler rules
│   └── src/
│       ├── App.js               # Root component with routing
│       ├── index.js             # React entry point
│       ├── index.css            # Global styles
│       ├── components/          # Reusable UI components
│       │   ├── Navbar.js        # Navigation bar
│       │   ├── CommandPalette.js # ⌘K command palette
│       │   ├── QuestionCard.js  # Question list item
│       │   ├── MarkdownRenderer.js
│       │   ├── ErrorBoundary.js
│       │   └── ...
│       ├── pages/               # Route pages
│       │   ├── Home.js          # Landing page + daily shloka
│       │   ├── Questions.js     # Question listing
│       │   ├── QuestionDetail.js# Single question view
│       │   ├── AskQuestion.js   # Ask question form
│       │   ├── AIChat.js        # AI scripture assistant
│       │   ├── GuruPortal.js    # Guru verification dashboard
│       │   ├── AdminPanel.js    # Admin management panel
│       │   ├── Profile.js       # User profile page
│       │   ├── Login.js         # Login page
│       │   ├── Register.js      # Registration page
│       │   └── ...
│       ├── context/
│       │   ├── AuthContext.js   # Authentication state
│       │   └── ThemeContext.js  # Dark mode state
│       ├── hooks/               # Custom React hooks
│       └── utils/
│           └── api.js           # Axios instance with interceptors
├── server/                      # Express backend
│   ├── index.js                 # Server entry point
│   ├── config/
│   │   └── passport.js          # Google OAuth configuration
│   ├── middleware/
│   │   ├── auth.js              # JWT auth, guruAuth, adminAuth
│   │   └── rateLimit.js         # Rate limiter factory
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Question.js
│   │   ├── Answer.js
│   │   ├── Comment.js
│   │   ├── Tag.js
│   │   ├── AIChat.js
│   │   ├── Review.js
│   │   └── WhatsAppMessage.js
│   ├── routes/                  # API route handlers
│   │   ├── auth.js              # Register, login, OAuth
│   │   ├── questions.js         # CRUD + voting + AI answer gen
│   │   ├── answers.js           # CRUD + voting
│   │   ├── comments.js          # CRUD + voting
│   │   ├── ai.js                # AI chat + tag suggestion
│   │   ├── guru.js              # Guru portal endpoints
│   │   ├── admin.js             # Admin panel + daily shloka
│   │   ├── users.js             # Profiles + favorites
│   │   ├── tags.js              # Tag management
│   │   ├── bounties.js          # Bounty system
│   │   ├── reviews.js           # Review queues
│   │   ├── bot.js               # Bot endpoints
│   │   ├── verses.js            # Scripture verse endpoints
│   │   └── whatsapp.js          # WhatsApp integration
│   ├── services/
│   │   └── whatsapp.js          # WhatsApp client service
│   ├── utils/
│   │   ├── vedabase.js          # Scripture search (RAG)
│   │   ├── aiUser.js            # System AI user management
│   │   └── shlokas.js           # Shloka data utilities
│   └── Procfile                 # Render process file
├── DEPLOYMENT_GUIDE.md          # Step-by-step deployment instructions
├── DATA_ARCHITECTURE.md         # Database schema documentation
├── USER_MANUAL.md               # End-user documentation
├── render.yaml                  # Render deployment config
├── .gitignore
└── README.md                    # ← You are here
```

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | User login |
| POST | `/api/auth/guru-login` | ❌ | Guru/Admin login |
| GET | `/api/auth/google` | ❌ | Initiate Google OAuth |
| GET | `/api/auth/me` | ✅ | Get current user |

### Questions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/questions` | ❌ | List questions (paginated) |
| GET | `/api/questions/:id` | ❌ | Get single question with answers |
| POST | `/api/questions` | ✅ | Create question + auto AI answer |
| PUT | `/api/questions/:id` | ✅ | Update question (author/admin) |
| DELETE | `/api/questions/:id` | ✅ | Delete question (author/admin) |
| POST | `/api/questions/:id/vote` | ✅ | Upvote/downvote |
| POST | `/api/questions/:id/accept/:answerId` | ✅ | Accept answer |

### Answers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/answers/:questionId` | ✅🎓 | Create answer (gurus/scholars only) |
| PUT | `/api/answers/:id` | ✅ | Update answer |
| DELETE | `/api/answers/:id` | ✅ | Delete answer |
| POST | `/api/answers/:id/vote` | ✅ | Upvote/downvote |

### AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | ✅ | Chat with AI scripture assistant |
| GET | `/api/ai/history/:sessionId` | ✅ | Get chat session history |
| GET | `/api/ai/sessions` | ✅ | List all chat sessions |
| POST | `/api/ai/suggest-tags` | ✅ | Get AI tag suggestions |
| POST | `/api/ai/post-to-community` | ✅ | Post chat Q&A as a question |

### Guru Portal
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/guru/dashboard` | ✅🎓 | Guru dashboard with stats |
| GET | `/api/guru/pending` | ✅🎓 | Pending verifications |
| POST | `/api/guru/verify/:answerId` | ✅🎓 | Verify an answer |
| POST | `/api/guru/unverify/:answerId` | ✅🎓 | Remove verification |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | ✅👑 | Full platform statistics |
| GET | `/api/admin/public-stats` | ❌ | Public homepage stats |
| GET | `/api/admin/daily-shloka` | ❌ | Daily rotating Gita verse |
| GET | `/api/admin/users` | ✅👑 | All users (paginated) |
| PUT | `/api/admin/users/:id/role` | ✅👑 | Change user role |
| POST | `/api/admin/ai-answers/:id/verify` | ✅👑 | Verify AI answer |
| POST | `/api/admin/ai-answers/:id/reject` | ✅👑 | Reject AI answer |

> ✅ = Requires login &nbsp;|&nbsp; 🎓 = Guru/Acharya/Admin &nbsp;|&nbsp; 👑 = Admin only

---

## 🚀 Local Development

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/Pariprashna.git
cd Pariprashna

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create `server/.env`:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pariprashna
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000
SITE_URL=http://localhost:5001
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm start
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5001](http://localhost:5001)

---

## 🏗 Deployment

See the full step-by-step guide: **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

**Quick summary:**
1. Push code to GitHub
2. Create MongoDB Atlas cluster → get `MONGODB_URI`
3. Deploy backend on Render → set environment variables
4. Deploy frontend on Vercel → set `REACT_APP_API_URL`
5. Update cross-references (CLIENT_URL, SITE_URL, OAuth redirect)

---

## 📊 Data Architecture

See **[DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)** for full database schema, collections, data flow diagrams, and security measures.

---

## 📖 User Manual

See **[USER_MANUAL.md](./USER_MANUAL.md)** for end-user documentation covering all features, reputation system, badge system, and FAQ.

---

## 👥 Account Roles

| Role | Permissions |
|------|-------------|
| **User** | Ask questions, vote, comment, chat with AI, set bounties |
| **Scholar** | All User permissions + post answers |
| **Guru** | All Scholar permissions + verify answers |
| **Acharya** | All Guru permissions + feature answers |
| **Admin** | Full access — user management, AI verification, content moderation |

---

## 🏆 Reputation System

| Action | Points |
|--------|--------|
| Ask a question | +5 |
| Answer a question | +10 |
| Answer accepted | +15 |
| Answer verified by Guru | +25 |
| Bounty awarded to you | +bounty amount |

---

## 📜 License

MIT

---

*Built with ❤️ for the Sanatan Dharma community*
