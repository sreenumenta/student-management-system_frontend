# Student Portal directory

A responsive student management app built with React, Vite, and plain CSS. It connects to the student, teacher, and course REST APIs.

## Run locally

```powershell
npm install
npm run dev
```

`react-router-dom` is already listed in `package.json`. To add it manually to a fresh project, run `npm install react-router-dom`. Open the local URL printed by Vite (usually `http://localhost:5173`). Use `npm run build` to create a production build and `npm run lint` to check the source.

## Features  ##

- Browse and search students; create teachers and courses, and manage them by ID.
- Student records include date of birth, address, course, and teacher assignments.
- Student, teacher, and course forms use the API field names and relationship IDs.
- Uses `https://student-management-system-wvmf.onrender.com` by default. Override it with `VITE_API_BASE_URL` when running or building the app.
- The Vite development server proxies `/api` requests to the configured API to avoid browser CORS restrictions during local development.
- Light and dark themes, responsive layout, and keyboard-accessible controls.
- Form validation and brief success/error notifications.

The deployed API currently allows GET for students, but not for teachers or courses. Teacher/course pages still support create and ID-based update/delete; edit uses PATCH for filled fields or PUT for full replacement when the API cannot return a record. The API also does not return CORS headers. The development proxy handles CORS locally; production hosting needs a same-origin API proxy or CORS enabled by the backend.
