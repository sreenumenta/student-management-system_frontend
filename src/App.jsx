import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import StudentList from './pages/StudentList.jsx'
import StudentForm from './pages/StudentForm.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/students" replace />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/new" element={<StudentForm />} />
        <Route path="/students/:id/edit" element={<StudentForm />} />
        <Route path="*" element={<Navigate to="/students" replace />} />
      </Route>
    </Routes>
  )
}

export default App
