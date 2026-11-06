# Student management frontend

This Vite + React app provides a student directory with add, edit, and delete flows. It uses plain CSS and `react-router-dom`; it does not connect to a backend or call an API. Sample student data is persisted in browser localStorage by `src/services/studentService.js`.

## Run the app

From this folder:

```powershell
npm install
npm run dev
```

`react-router-dom` is listed in `package.json` and is installed by `npm install`. To add it manually to a fresh project, run:

```powershell
npm install react-router-dom
```

Vite prints the local URL after startup (usually `http://localhost:5173`). Press `Ctrl + C` in the terminal to stop it.

## Checks

```powershell
npm run lint
npm run build
```

The interface includes search, course and status filters, eight-student pagination, form validation, toast notifications, a delete confirmation dialog, and light/dark mode. The nine sample records are for local UI use only.
