# Student Portal directory

A responsive student directory built with React, Vite, and plain CSS. Student records are sample data stored in the browser's localStorage; the app does not connect to a backend.

## Run locally

```powershell
npm install
npm run dev
```

`react-router-dom` is already listed in `package.json`. To add it manually to a fresh project, run `npm install react-router-dom`. Open the local URL printed by Vite (usually `http://localhost:5173`). Use `npm run build` to create a production build and `npm run lint` to check the source.

## Features

- Browse, search, filter, edit, add, and delete student records.
- Sample roster of nine Indian students, persisted in localStorage.
- Light and dark themes, responsive layout, and keyboard-accessible controls.
- Form validation and brief success/error notifications.
