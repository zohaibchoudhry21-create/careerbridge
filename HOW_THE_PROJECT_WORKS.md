# How CareerBridge Works

AI CareerBridge has six main areas. This file describes **what each one does** and **how a user moves through it**.

---

## 1. Landing page (`/`)

Public marketing site. Login is not required.

It introduces the product in this order:

1. **Hero** — headline, CTA to get started, resume previews
2. **Trust badges** — free resume, privacy, unlimited downloads
3. **Problem** — why generic resumes and unprepared interviews fail
4. **Solution** — what CareerBridge does instead
5. **Features** — Resume Builder, Resume Scanner, Interview Prep
6. **How it works** — three steps: build → scan → interview
7. **Final CTA** — sign up / start
8. **Interview prep steps** — extra section on mock interviews

Navbar sends guests to login/register. After login, the same product areas open inside the dashboard.

---

## 2. Dashboard (`/dashboard`)

Home screen after login. Sidebar links: Dashboard, Resume Builder, Resume Scanner, Interview Prep, Settings.

The page loads real overview data from the API and shows:

- **Welcome** — greeting and short status
- **Career progress** — interview readiness / recent prep activity
- **Resume Scanner snapshot** — ATS / profile strength, or a CTA to scan if there is no data yet

From here the user jumps into Builder, Scanner, or Interview Prep.

---

## 3. Resume Builder (`/resume/upload`)

Build or edit a resume.

1. Upload a PDF/DOCX or start a blank resume.
2. The app extracts and stores a parsed resume.
3. Open the editor (`/resume/:id/edit`): sections, templates, optional AI text help.
4. Preview details (`/resume/:id`) and download.
5. **Resume history** (`/resume/history`) lists past resumes with search.

---

## 4. Resume Scanner (`/resume-scanner`)

Match a resume to a job description (ATS).

1. Upload a resume and paste the job description.
2. The app extracts text, scores ATS fit, and either **optimizes** (suggestions you accept/undo) or **rewrites** (then you accept or reject).
3. After you are happy with the result, **finalize**. PDF download is only after finalize.

Analysis lives at `/resume-scanner/:analysisId`.

---

## 5. Interview Prep (`/interview-prep`)

Hub with two tracks.

**AI mock interview** (`/interview-prep/mock`)

1. Customize: role, optional resume, experience, company, difficulty, duration, focus areas, video+voice or voice-only.
2. Start a live voice interview with the AI interviewer.
3. After the call, a scored report is saved (content, voice, video where available).
4. **Interview history** lists past sessions; open a card to read the report.

**Skill assessment** (`/interview-prep/skills`)

1. Pick topic, difficulty, and number of questions.
2. Take an MCQ quiz.
3. See score and weak areas. Scoring is done on the server from the stored answers.

---

## 6. Settings (`/settings`)

Account hub. Cards open:

| Page | What it is for |
|------|----------------|
| Personal information | Name, contact, location, LinkedIn, avatar |
| Login & security | Password, optional 2FA |
| Appearance | Theme / display |
| Account management | Export data or delete account |
