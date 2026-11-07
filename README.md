# TutorDesk Backend

Backend API for the TutorDesk Android app. Tutors upload study material (PDFs or images), and the server uses Google Gemini to extract the text and generate exam questions (MCQ, short answer and long answer). The questions can be exported as a formatted question paper PDF and an answer key PDF, and saved to a "My Papers" list.

## Features

- Extracts text from uploaded PDFs and images with Gemini
- Generates MCQ, short and long answer questions in the requested language
- Handles large documents with RAG: the text is chunked, embedded, and only the chunks relevant to the syllabus are used
- Lets the tutor regenerate questions from the same material without re-uploading
- Typesets math and formulas with KaTeX (the model writes LaTeX between `$...$`)
- Renders the question paper and answer key as A4 PDFs, including Bengali and Devanagari text
- Saves papers per tutor and lists them
- Authenticates every request with Firebase ID tokens

## Tech Stack

| Area | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | Firebase Admin SDK |
| AI | Google Gemini (`@google/genai`) |
| PDF | Puppeteer Core and `@sparticuz/chromium` |
| Math | KaTeX |
| Uploads | Multer (memory storage) |

## Project Structure

```
app.js                    Server entry point
Config/
  constants.js            RAG and session settings
  firebaseAdmin.js        Firebase Admin setup
  mogoDB.js               MongoDB connection
Controllers/
  generateController.js   Generate, regenerate and delete session
  paperController.js      PDF generation and saved papers
Middleware/
  isAuth.js               Firebase token verification
Models/
  Paper.js                Saved papers
  RagVector.js            Temporary document vectors (expire after 6 hours)
Routes/
  generateQuestionRouter.js
  paperRouter.js
Utils/
  extraction.js           Text extraction with Gemini
  generate.js             Question generation with Gemini
  htmlTemplate.js         Question paper and answer key HTML
  mathRenderer.js         HTML escaping and KaTeX math rendering
  paperAssembler.js       Groups questions into sections
  pdfRenderer.js          Shared Chromium and PDF queue
  routing.js              Chooses direct or RAG route
  tokenCounter.js         Token estimate
  Rag/                    Chunking, embedding and retrieval
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A MongoDB database (for example MongoDB Atlas)
- A Firebase project with a service account
- A Google Gemini API key (sent by the app with each request)

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env` and fill it in:

| Variable | Description |
|---|---|
| `PORT` | Port to run on (default 8080) |
| `MONGO_URI` | MongoDB connection string |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 of your `firebase-service-account.json` |

Create the Firebase value with:

```bash
# Mac / Linux
base64 -i firebase-service-account.json | tr -d '\n'

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-service-account.json"))
```

### Run

```bash
npm run dev     # development, restarts on changes
npm start       # production
```

For production on a small server (1 core, about 1 GB RAM), use PM2 so a crash restarts the server and Node can't use all the memory:

```bash
pm2 start app.js --node-args="--max-old-space-size=384" --max-memory-restart 600M
```

## API

All `/api` routes need the header `Authorization: Bearer <Firebase ID token>`. Errors return JSON like `{ "error": "message" }`.

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/generate` | Upload files (`files`), send `api_key` and `requirements`. Returns `{ questions, sessionId }` |
| POST | `/api/regenerate` | Send `sessionId`, `requirements` and `api_key`. Returns new `{ questions, sessionId }` |
| DELETE | `/api/session` | Send `sessionId`. Deletes the stored vectors |
| POST | `/api/generate-pdf` | Send `selectedQuestions` and `metadata`. Returns the question paper PDF |
| POST | `/api/generate-answersheet` | Same body. Returns the answer key PDF |
| POST | `/api/papers` | Save a paper (`title`, `metadata`, `selectedQuestions`) |
| GET | `/api/papers` | List the logged-in tutor's saved papers |

`requirements` contains `mcqCount`, `shortCount`, `longCount`, `language` and an optional `syllabus`. `metadata` contains `institutionName`, `className`, `timeAllowed`, `totalMarks` and `watermark`.

## How It Works

1. **Extraction.** The uploaded files are sent to Gemini, which returns the text split into sections.
2. **Routing.** Short documents (about 50,000 tokens or less) go straight to question generation. Longer ones use RAG.
3. **RAG.** The text is split into chunks, embedded with `gemini-embedding-001` (768 dimensions) and stored in MongoDB for 6 hours. The chunks most relevant to the syllabus are picked for generation. The same stored chunks are used again when the tutor regenerates.
4. **Generation.** Gemini returns the questions as JSON. Formulas are written in LaTeX between `$...$`.
5. **PDF.** The questions are turned into HTML, math is typeset with KaTeX, and a shared headless Chromium prints it as an A4 PDF.

## Limits and Performance

Built for a small server, the defaults are:

- Uploads: at most 20 MB in total across all files. Larger uploads get a 413 with a clear message.
- At most 4 `/generate` jobs run at once. Extra requests wait their turn.
- At most 2 PDFs render at once, using one shared Chromium. Extra requests wait.
- Vector sessions are deleted automatically after 6 hours.

Settings are in `Config/constants.js` and at the top of `Routes/generateQuestionRouter.js` and `Utils/pdfRenderer.js`.
