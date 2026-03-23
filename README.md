# CodeSense — AI-Powered Code Review API

![Node.js](https://img.shields.io/badge/Node.js-22.x-green?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?style=flat-square&logo=express)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Deploy](https://img.shields.io/badge/Deployed-Render-purple?style=flat-square)

> A production-grade REST API that accepts code submissions and returns AI-driven analysis — bug detection, security vulnerability scanning, complexity feedback, and refactor suggestions. Built to solve the real-world problem of inaccessible senior code review for solo developers and small teams.

**Live Demo:** https://ai-code-review-api-3.onrender.com  
**GitHub:** https://github.com/devendra-code-hub/ai-code-review-api

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)

---

## Features

- **AI Code Review** — Submits code to LLM and returns structured feedback: bugs, security issues, complexity analysis, refactor suggestions, and a quality score (1–10)
- **JWT Authentication** — Stateless auth supporting horizontal scaling; register, login, protected routes
- **Rate Limiting** — Per-window request limits to prevent abuse and control LLM API costs
- **Input Validation** — Zod schema validation on all inputs with centralized error handling
- **Frontend UI** — Dark-themed single-page interface to paste code and view AI review in real time
- **Production Ready** — Deployed on Render with environment-based config, morgan logging, and helmet security headers

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 22 | Non-blocking I/O, ideal for API servers |
| Language | TypeScript | Type safety, better IDE support, fewer runtime errors |
| Framework | Express.js | Minimal, fast, well-supported REST framework |
| AI | OpenRouter (Gemma/Llama) | Free-tier LLM access for code analysis |
| Auth | JWT (jsonwebtoken) | Stateless, scalable, no session storage needed |
| Validation | Zod | Runtime type-safe schema validation |
| Security | Helmet, express-rate-limit | HTTP headers hardening, abuse prevention |
| Deployment | Render | Free tier, auto-deploy from GitHub |

---

## Project Structure

```
ai-code-review-api/
├── public/
│   └── index.html          # Frontend UI (vanilla HTML/CSS/JS)
├── src/
│   ├── config/
│   │   └── index.ts        # Centralised env config (PORT, JWT_SECRET, API keys)
│   ├── middleware/
│   │   ├── auth.ts         # JWT verification middleware
│   │   ├── rateLimiter.ts  # express-rate-limit configs
│   │   └── errorHandler.ts # Global error handler
│   ├── routes/
│   │   └── review.ts       # /api/review route — validates input, calls AI service
│   ├── services/
│   │   └── aiService.ts    # OpenRouter API integration, prompt engineering
│   ├── types/
│   │   └── index.ts        # Shared TypeScript interfaces
│   └── index.ts            # App entry — middleware setup, auth routes, server start
├── .env.example            # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- Git
- An [OpenRouter](https://openrouter.ai) API key (free)

### Installation

```bash
# Clone the repository
git clone https://github.com/devendra-code-hub/ai-code-review-api.git
cd ai-code-review-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
JWT_SECRET=your_super_secret_key
ANTHROPIC_API_KEY=sk-or-your-openrouter-key
NODE_ENV=development
```

### Run Locally

```bash
npm run dev
```

Server starts at `http://localhost:3000`  
Frontend UI at `http://localhost:3000`  
Health check at `http://localhost:3000/api/review/health`

### Build for Production

```bash
npm run build
npm start
```

---

## API Reference

### Auth

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "message": "Registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### Review

#### Analyze Code
```
POST /api/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "language": "javascript",
  "code": "function add(a,b){ return a+b }",
  "context": "utility function for a calculator app"
}
```

**Response:**
```json
{
  "success": true,
  "user": "user@example.com",
  "review": {
    "bugs": ["Missing input type validation — non-numbers will cause NaN"],
    "security": ["No issues found"],
    "complexity": "O(1) — constant time, minimal complexity",
    "suggestions": [
      "Add JSDoc comments",
      "Validate that inputs are numbers before operating"
    ],
    "score": 6,
    "summary": "Simple, functional utility but lacks robustness for production use."
  }
}
```

#### Health Check
```
GET /api/review/health
```

---

### Input Constraints

| Field | Type | Min | Max | Required |
|-------|------|-----|-----|----------|
| code | string | 10 chars | 10,000 chars | Yes |
| language | string | 1 char | 50 chars | Yes |
| context | string | — | 500 chars | No |

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/review | 10 requests | 15 minutes |
| POST /api/auth/* | 20 requests | 1 hour |

---

## Architecture

```
Client (Browser / Postman)
        │
        ▼
   Express Server (src/index.ts)
        │
        ├── Helmet (security headers)
        ├── CORS
        ├── Morgan (request logging)
        ├── express.json (body parsing)
        │
        ├── POST /api/auth/register ──► bcrypt hash ──► in-memory store ──► JWT
        ├── POST /api/auth/login    ──► bcrypt compare ──► JWT
        │
        └── /api/review (review.ts router)
                │
                ├── authenticate middleware (auth.ts)
                │       └── verifies JWT from Authorization header
                │
                ├── reviewRateLimiter middleware (rateLimiter.ts)
                │       └── max 10 req / 15 min per IP
                │
                ├── Zod schema validation
                │
                └── analyzeCode() (aiService.ts)
                        │
                        └── POST https://openrouter.ai/api/v1/chat/completions
                                └── returns structured JSON review
```

---

## Design Decisions

**Why TypeScript over JavaScript?**  
TypeScript catches type errors at compile time. For a production API with multiple middleware layers and service integrations, it prevents entire categories of runtime bugs — especially around request/response shapes.

**Why JWT over sessions?**  
Sessions require server-side storage (Redis/DB). JWT is stateless — the token itself carries the payload. This means the API can scale horizontally across multiple instances without shared session state.

**Why Zod for validation?**  
Express doesn't validate request bodies by default. Zod provides runtime type-safe validation with detailed error messages, preventing malformed inputs from reaching the AI service or causing unexpected crashes.

**Why OpenRouter instead of direct OpenAI/Claude?**  
OpenRouter provides a unified API across 50+ models with a generous free tier. This means the service can switch underlying models (Llama, Gemma, Mistral) without changing application code — just a model name string.

**Why rate limiting on the review endpoint?**  
Each AI review call hits an external API with potential costs. Rate limiting prevents a single user from exhausting the quota and protects against abuse in a public-facing deployment.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 3000) | No |
| JWT_SECRET | Secret for signing JWTs | Yes |
| ANTHROPIC_API_KEY | OpenRouter API key | Yes |
| MONGODB_URI | MongoDB connection string | No |
| NODE_ENV | development / production | No |

---

## License

MIT © [Devendra Kumar Mahto](https://github.com/devendra-code-hub)
