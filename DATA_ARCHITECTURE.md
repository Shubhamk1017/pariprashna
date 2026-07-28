# Hindu QnA - Data Storage Architecture

## System Overview

Hindu QnA uses a cloud-based architecture with MongoDB Atlas as the primary database, Render for backend hosting, and Vercel for frontend hosting.

---

## Database: MongoDB Atlas

**Provider:** MongoDB Atlas (Cloud)
**Database Name:** `hindu_qna`
**Region:** Multi-region cluster

### Connection Details
```
mongodb+srv://cluster0.zxaccpw.mongodb.net/hindu_qna
```

---

## Collections

### 1. users

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique user ID |
| name | String | Display name |
| email | String | Email address (unique) |
| password | String | Hashed password (bcrypt) |
| avatar | String | Profile picture URL |
| role | Enum | user / scholar / guru / acharya / admin |
| provider | Enum | local / google / github |
| providerId | String | OAuth provider ID |
| reputation | Number | Points earned from voting |
| badges | Array | {name, type: bronze/silver/gold/special} |
| privileges | Array | Earned privileges |
| questions | Array[ObjectId] | References to questions |
| answers | Array[ObjectId] | References to answers |
| comments | Array[ObjectId] | References to comments |
| favorites | Array[ObjectId] | Saved questions |
| createdAt | Date | Account creation date |

### 2. questions

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique question ID |
| title | String | Question title (15-300 chars) |
| body | String | Question body (Markdown) |
| author | ObjectId | Reference to users |
| tags | Array[ObjectId] | References to tags |
| answers | Array[ObjectId] | References to answers |
| comments | Array[ObjectId] | References to comments |
| upvotes | Array[ObjectId] | Users who upvoted |
| downvotes | Array[ObjectId] | Users who downvoted |
| views | Number | View count |
| isClosed | Boolean | Whether question is closed |
| isProtected | Boolean | Whether question is protected |
| isBounty | Boolean | Whether bounty is active |
| bountyAmount | Number | Bounty reputation amount |
| bountyCreator | ObjectId | Who set the bounty |
| bountyWinner | ObjectId | Who received the bounty |
| bountyExpiresAt | Date | Bounty expiration |
| acceptedAnswer | ObjectId | Best answer reference |
| createdAt | Date | Post date |
| updatedAt | Date | Last update date |

### 3. answers

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique answer ID |
| body | String | Answer body (Markdown) |
| author | ObjectId | Reference to users |
| question | ObjectId | Reference to questions |
| upvotes | Array[ObjectId] | Users who upvoted |
| downvotes | Array[ObjectId] | Users who downvoted |
| isAccepted | Boolean | Whether answer is accepted |
| isVerifiedByGuru | Boolean | Guru verification status |
| verifiedBy | ObjectId | Which guru verified |
| verifiedAt | Date | Verification date |
| verificationNote | String | Guru's verification note |
| isAIGenerated | Boolean | Whether AI generated this |
| aiModel | String | Which AI model (e.g., llama-3.1-8b-instant) |
| isVerifiedByAdmin | Boolean | Admin verification status |
| adminVerifiedBy | ObjectId | Which admin verified |
| adminVerifiedAt | Date | Admin verification date |
| adminNote | String | Admin's verification note |
| comments | Array[ObjectId] | References to comments |
| createdAt | Date | Post date |
| updatedAt | Date | Last update date |

### 4. comments

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique comment ID |
| body | String | Comment text (max 500 chars) |
| author | ObjectId | Reference to users |
| post | ObjectId | Reference to question or answer |
| postModel | String | "Question" or "Answer" |
| upvotes | Array[ObjectId] | Users who upvoted |
| createdAt | Date | Post date |

### 5. tags

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique tag ID |
| name | String | Tag name (unique, lowercase) |
| description | String | Tag description |
| wiki | String | Extended tag documentation |
| count | Number | Questions using this tag |
| synonyms | Array[String] | Alternative tag names |
| createdAt | Date | Creation date |

### 6. reviews

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique review ID |
| type | Enum | first_question / first_answer / late_answer / close_vote / suggested_edit |
| post | ObjectId | Reference to question or answer |
| postModel | String | "Question" or "Answer" |
| author | ObjectId | Who created the post |
| reviewers | Array | [{user, action, reviewedAt}] |
| status | Enum | pending / approved / rejected |
| createdAt | Date | Creation date |

### 7. aichats

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Unique session ID |
| user | ObjectId | Reference to users |
| sessionId | String | Frontend session identifier |
| messages | Array | [{role: user/assistant, content, timestamp}] |
| context | Object | {relatedQuestions: [ObjectId]} |
| createdAt | Date | Session start date |

---

## External Services

### Render (Backend Hosting)
- **URL:** https://hindu-qna.onrender.com
- **Runtime:** Node.js
- **Free tier:** Spins down after inactivity
- **Environment variables stored:** MongoDB URI, JWT secret, API keys

### Vercel (Frontend Hosting)
- **URL:** https://hindu-qna.vercel.app
- **Framework:** React (Create React App)
- **Environment variables stored:** REACT_APP_API_URL

### Groq (AI Inference)
- **Model:** llama-3.1-8b-instant
- **Free tier:** 14,400 requests/day
- **Used for:** AI chatbot + auto-generated answers

### Google OAuth
- **Provider:** Google Cloud Console
- **Used for:** Google login authentication

### GitHub
- **Repository:** https://github.com/Shubhamk1017/hindu-qna
- **Used for:** Source code storage + auto-deploy

---

## Data Flow

### User Registration
```
User → Frontend → Backend API → MongoDB (users collection)
                                → JWT token returned
```

### Asking a Question
```
User → Frontend → Backend API → MongoDB (questions collection)
                                → Background: AI generates answer
                                → MongoDB (answers collection, isAIGenerated: true)
```

### AI Chat
```
User → Frontend → Backend API → Groq API → Response
                                → MongoDB (aichats collection)
                                → Returns shlokas from vedabase.io
```

### Guru Verification
```
Guru → Guru Portal → Backend API → MongoDB (answers collection, isVerifiedByAdmin: true)
                                   → Answer now visible to all users
```

### Voting
```
User → Frontend → Backend API → MongoDB (questions/answers, upvotes/downvotes arrays)
                                → User reputation updated
```

---

## Browser Storage (localStorage)

| Key | Purpose |
|-----|---------|
| token | JWT authentication token |
| viewedQuestions | Array of question IDs viewed (prevents duplicate view counts) |

---

## Data Backup

MongoDB Atlas provides:
- **Continuous backups** (point-in-time recovery)
- **Manual snapshots** (on-demand)
- **Cross-region replication** (high availability)

---

## Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcryptjs |
| JWT tokens | 7-day expiry |
| CORS | Configured for frontend domain |
| API authentication | Bearer token in headers |
| Role-based access | middleware/auth.js |
| Input validation | express-validator |
| SQL injection | N/A (NoSQL database) |
| XSS protection | React auto-escapes |

---

## Free Tier Limits

| Service | Free Limit |
|---------|-----------|
| MongoDB Atlas | 512 MB storage |
| Render | 512 MB RAM, spins down after inactivity |
| Vercel | 100 GB bandwidth/month |
| Groq | 14,400 requests/day |

---

*Document generated for Hindu QnA project*
*Last updated: May 2026*
