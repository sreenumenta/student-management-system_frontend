import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Icon from '../components/Icons.jsx'
import { COURSES, deleteStudent, getStudents } from '../services/studentService.js'

const PAGE_SIZE = 8

function StudentList() {
  const { showToast } = useOutletContext()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    async function loadStudents() {
      try {
        const data = await getStudents()
        if (active) {
          setStudents(data)
          setLoadError(false)
        }
      } catch {
        if (active) {
          setLoadError(true)
          showToast('Could not load students. Please try again.', 'error')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadStudents()
    return () => { active = false }
  }, [showToast])

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch = !query || [
        student.firstName, student.lastName, student.email, student.phone, student.course,
      ].some((value) => value.toLowerCase().includes(query))
      return matchesSearch && (!course || student.course === course) && (!status || student.status === status)
    })
  }, [students, search, course, status])
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const activeCount = students.filter((student) => student.status === 'Active').length

  async function handleDelete() {
    if (!studentToDelete) return
    setDeleting(true)
    try {
      await deleteStudent(studentToDelete.id)
      setStudents((current) => current.filter((student) => student.id !== studentToDelete.id))
      showToast(`${studentToDelete.firstName} ${studentToDelete.lastName} was removed.`, 'ok')
      setStudentToDelete(null)
    } catch {
      showToast('Could not delete this student. Please try again.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="students-page">
      <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">Students</span></div>
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> YOUR CAMPUS, IN GOOD COMPANY</p>
          <h1>Student directory<span className="heading-period">.</span></h1>
          <p className="page-description">Every bright future, all in one place.</p>
        </div>
        <Link className="button button-primary" to="/students/new">
          <Icon name="add" size={18} />
          Add student
        </Link>
      </div>

      <section className="overview-card" aria-label="Student overview">
        <div className="overview-copy">
          <span className="overview-kicker">A COMMUNITY ON THE MOVE</span>
          <strong>{students.length} enrolled<span className="overview-dot"> · </span>{activeCount} active</strong>
          <span className="overview-note">Small steps. Big things ahead.</span>
        </div>
        <div className="overview-stat">
          <span className="stat-label">ACTIVE LEARNERS</span>
          <strong>{String(activeCount).padStart(2, '0')}<span> / {String(students.length).padStart(2, '0')}</span></strong>
        </div>
        <div className="overview-art" aria-hidden="true">
          <div className="overview-sun" />
          <div className="overview-orbit orbit-one" />
          <div className="overview-orbit orbit-two" />
          <div className="overview-wave wave-one" />
          <div className="overview-wave wave-two" />
        </div>
      </section>

      <section className="directory-panel">
        <div className="directory-top">
          <div>
            <div className="section-title-row">
              <span className="section-index">01</span>
              <h2>All students</h2>
            </div>
            <p className="section-caption">A little progress each day adds up.</p>
          </div>
          <span className="record-count">{filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}</span>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <span className="visually-hidden">Search students</span>
            <input
              type="search"
              placeholder="Search by name, course or email…"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            />
            {search && <button className="search-clear" onClick={() => { setSearch(''); setPage(1) }} aria-label="Clear search"><Icon name="close" size={15} /></button>}
          </label>
          <label className="filter-field">
            <Icon name="filter" size={17} />
            <span className="visually-hidden">Filter by course</span>
            <select value={course} onChange={(event) => { setCourse(event.target.value); setPage(1) }}>
              <option value="">All courses</option>
              {COURSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Icon className="select-chevron" name="chevronDown" size={15} />
          </label>
          <label className="filter-field status-filter">
            <span className="visually-hidden">Filter by status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
              <option value="">Any status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Icon className="select-chevron" name="chevronDown" size={15} />
          </label>
        </div>

        <div className="table-scroll">
          <table className="student-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Course</th>
                <th scope="col">Year</th>
                <th scope="col">Phone</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }, (_, index) => (
                <tr className="skeleton-row" key={`skeleton-${index}`}>
                  <td><span className="skeleton-avatar" /><span className="skeleton-line skeleton-name" /><span className="skeleton-line skeleton-email" /></td>
                  <td><span className="skeleton-line skeleton-medium" /></td>
                  <td><span className="skeleton-line skeleton-short" /></td>
                  <td><span className="skeleton-line skeleton-medium" /></td>
                  <td><span className="skeleton-pill" /></td>
                  <td><span className="skeleton-line skeleton-actions" /></td>
                </tr>
              )) : visibleStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-cell">
                      <Avatar firstName={student.firstName} lastName={student.lastName} />
                      <span className="student-identity">
                        <strong>{student.firstName} {student.lastName}</strong>
                        <span>{student.email}</span>
                      </span>
                    </div>
                  </td>
                  <td><span className="course-name">{student.course}</span></td>
                  <td><span className="year-label">Year {student.year}</span></td>
                  <td><span className="phone-label">{student.phone}</span></td>
                  <td><span className={`status-badge status-${student.status.toLowerCase()}`}><i />{student.status}</span></td>
                  <td>
                    <div className="row-actions">
                      <Link className="icon-button" to={`/students/${student.id}/edit`} aria-label={`Edit ${student.firstName} ${student.lastName}`} title="Edit student"><Icon name="edit" size={17} /></Link>
                      <button className="icon-button icon-button-danger" onClick={() => setStudentToDelete(student)} aria-label={`Delete ${student.firstName} ${student.lastName}`} title="Delete student"><Icon name="trash" size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && loadError && (
            <div className="empty-state">
              <div className="empty-mark"><Icon name="more" size={24} /></div>
              <h3>We couldn’t open the directory</h3>
              <p>Check your browser storage and refresh to try again.</p>
            </div>
          )}
          {!loading && !loadError && visibleStudents.length === 0 && (
            <div className="empty-state">
              <div className="empty-mark"><Icon name="search" size={23} /></div>
              <h3>{students.length ? 'No students found' : 'Your directory is ready'}</h3>
              <p>{students.length ? 'Try another search or clear your filters.' : 'Add your first student to get things started.'}</p>
              {students.length === 0
                ? <Link className="button button-primary button-small" to="/students/new"><Icon name="add" size={16} />Add student</Link>
                : <button className="text-button" onClick={() => { setSearch(''); setCourse(''); setStatus(''); setPage(1) }}>Clear filters</button>}
            </div>
          )}
        </div>

        <div className="table-footer">
          <span className="pagination-summary">
            {filteredStudents.length === 0 ? 'Showing 0 students' : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of ${filteredStudents.length} students`}
          </span>
          <div className="pagination">
            <button className="page-button page-arrow" disabled={currentPage <= 1 || loading} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><Icon name="arrowLeft" size={16} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button key={number} className={`page-button${number === currentPage ? ' page-current' : ''}`} onClick={() => setPage(number)} disabled={loading} aria-label={`Page ${number}`} aria-current={number === currentPage ? 'page' : undefined}>{number}</button>
            ))}
            <button className="page-button page-arrow" disabled={currentPage >= pageCount || loading} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><Icon name="arrowLeft" className="arrow-next" size={16} /></button>
          </div>
        </div>
      </section>
      <ConfirmDialog
        student={studentToDelete}
        onCancel={() => setStudentToDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
      />
    </section>
  )
}

export default StudentList
