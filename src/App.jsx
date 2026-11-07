import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import EntityForm from './pages/EntityForm.jsx'
import EntityDetail from './pages/EntityDetail.jsx'
import EntityList from './pages/EntityList.jsx'
import EntityManage from './pages/EntityManage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/students" replace />} />
        <Route path="/students" element={<EntityList key="students" resource="students" />} />
        <Route path="/students/new" element={<EntityForm key="students-new" resource="students" />} />
        <Route path="/students/:id" element={<EntityDetail resource="students" />} />
        <Route path="/students/:id/edit" element={<EntityForm resource="students" />} />
        <Route path="/teachers" element={<EntityList key="teachers" resource="teachers" />} />
        <Route path="/teachers/new" element={<EntityForm key="teachers-new" resource="teachers" />} />
        <Route path="/teachers/manage" element={<EntityManage resource="teachers" />} />
        <Route path="/teachers/:id" element={<EntityDetail resource="teachers" />} />
        <Route path="/teachers/:id/edit" element={<EntityForm resource="teachers" />} />
        <Route path="/courses" element={<EntityList key="courses" resource="courses" />} />
        <Route path="/courses/new" element={<EntityForm key="courses-new" resource="courses" />} />
        <Route path="/courses/manage" element={<EntityManage resource="courses" />} />
        <Route path="/courses/:id" element={<EntityDetail resource="courses" />} />
        <Route path="/courses/:id/edit" element={<EntityForm resource="courses" />} />
        <Route path="*" element={<Navigate to="/students" replace />} />
      </Route>
    </Routes>
  )
}

export default App
