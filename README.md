# Class Record & Outcome Tracker

A web application designed for higher education institutions to manage class records, student grades, and course outcome attainment. Built with Vue 3, TypeScript, and Supabase.

## Key Features

- **Course Management** – Create, edit, archive, and browse courses with status tracking.
- **Syllabus Upload** – Upload a PDF syllabus and automatically extract course outcomes (via Gemini).
- **Student & Grade Management** – Enroll students, input/update grades per assessment, and view real‑time attainment percentages.
- **Custom Max Scores** – Edit max scores directly on the class record page—no need to navigate away.
- **Attainment & Intervention** – Automatically compute CO attainment, flag students needing intervention, and track enrollment status (Passed/Failed).
- **PDF Export** – Generate printable class records with all computed data.
- **Role‑based Access** – Faculty manage their own courses; chairpersons oversee all faculty records and accounts.
- **Pagination & Responsive Design** – Works smoothly on desktops and tablets, with pagination for large datasets.

## Tech Stack

- Frontend: Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS, Phosphor Icons
- Backend: Supabase (PostgreSQL, Auth, Edge Functions)
- PDF Generation: html2pdf.js / Supabase Edge Function
- AI Integration: Google Gemini (syllabus extraction)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (`.env` with Supabase URL, anon key, and Gemini API key)
4. Run the development server: `npm run dev`

---

*Developed for faculty and chairperson use in higher education settings.*
