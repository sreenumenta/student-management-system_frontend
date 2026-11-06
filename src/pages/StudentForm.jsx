import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import { APP_NAME } from '../config/appConfig.js'
import { COURSES, createStudent, getStudent, updateStudent } from '../services/studentService.js'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  course: COURSES[0],
  year: '1',
  status: 'Active',
}

function validate(values) {
  const errors = {}
  if (!values.firstName.trim()) errors.firstName = 'First name is required.'
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (!/^\d{10}$/.test(values.phone)) errors.phone = 'Phone number must be exactly 10 digits.'
  return errors
}

function StudentForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { showToast } = useOutletContext()
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) return undefined
    let active = true
    async function loadStudent() {
      try {
        const student = await getStudent(id)
        if (!active) return
        if (!student) {
          showToast('That student could not be found.', 'error')
          navigate('/students', { replace: true })
          return
        }
        setValues({
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          course: student.course,
          year: String(student.year),
          status: student.status,
        })
      } catch {
        if (active) {
          showToast('Could not load this student. Please try again.', 'error')
          navigate('/students', { replace: true })
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadStudent()
    return () => { active = false }
  }, [id, isEditing, navigate, showToast])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstInvalidField = Object.keys(nextErrors)[0]
      document.getElementById(firstInvalidField)?.focus()
      return
    }

    setSaving(true)
    const studentData = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      year: Number(values.year),
    }
    try {
      if (isEditing) {
        await updateStudent(id, studentData)
        showToast('Student details saved.', 'ok')
      } else {
        await createStudent(studentData)
        showToast('Student added to the directory.', 'ok')
      }
      navigate('/students')
    } catch {
      showToast(`Could not ${isEditing ? 'save' : 'add'} this student. Please try again.`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="form-page">
        <div className="breadcrumb"><Link to="/students">Students</Link><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">Loading</span></div>
        <div className="form-loading"><span className="skeleton-line skeleton-heading" /><span className="skeleton-line skeleton-medium" /><div className="form-loading-card" /></div>
      </section>
    )
  }

  return (
    <section className="form-page">
      <div className="breadcrumb"><Link to="/students">Students</Link><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{isEditing ? 'Edit student' : 'New student'}</span></div>
      <div className="form-heading">
        <Link className="back-link" to="/students"><Icon name="arrowLeft" size={17} /> Back to students</Link>
        <p className="eyebrow"><span className="eyebrow-line" /> {isEditing ? 'A NEW CHAPTER' : 'MAKE ROOM FOR GROWTH'}</p>
        <h1>{isEditing ? 'Edit student' : 'Add a student'}<span className="heading-period">.</span></h1>
        <p className="page-description">{isEditing ? 'Keep their details up to date.' : 'Good things start with a name.'}</p>
      </div>

      <div className="form-layout">
        <form className="student-form" onSubmit={handleSubmit} noValidate>
          <div className="form-section-heading">
            <span className="section-index">01</span>
            <div><h2>Student details</h2><p>All fields are required unless noted.</p></div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="firstName">First name <span>*</span></label>
              <input id="firstName" name="firstName" value={values.firstName} onChange={handleChange} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'firstName-error' : undefined} placeholder="e.g. Ananya" />
              {errors.firstName && <span className="field-error" id="firstName-error">{errors.firstName}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="lastName">Last name <span>*</span></label>
              <input id="lastName" name="lastName" value={values.lastName} onChange={handleChange} autoComplete="family-name" aria-invalid={Boolean(errors.lastName)} aria-describedby={errors.lastName ? 'lastName-error' : undefined} placeholder="e.g. Iyer" />
              {errors.lastName && <span className="field-error" id="lastName-error">{errors.lastName}</span>}
            </div>
            <div className="form-field form-field-wide">
              <label htmlFor="email">Email address <span>*</span></label>
              <input id="email" name="email" type="email" value={values.email} onChange={handleChange} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} placeholder="name@university.edu" />
              {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone number <span>*</span></label>
              <div className={`phone-input${errors.phone ? ' input-invalid' : ''}`}>
                <span className="phone-prefix">+91</span>
                <input id="phone" name="phone" type="tel" inputMode="numeric" maxLength={10} value={values.phone} onChange={handleChange} autoComplete="tel-national" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'} placeholder="10-digit number" />
              </div>
              {errors.phone
                ? <span className="field-error" id="phone-error">{errors.phone}</span>
                : <span className="field-hint" id="phone-hint">Enter 10 digits, without spaces.</span>}
            </div>
            <div className="form-field">
              <label htmlFor="course">Course <span>*</span></label>
              <div className="form-select-wrap">
                <select id="course" name="course" value={values.course} onChange={handleChange}>
                  {COURSES.map((course) => <option key={course} value={course}>{course}</option>)}
                </select>
                <Icon name="chevronDown" size={16} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="year">Year of study <span>*</span></label>
              <div className="form-select-wrap">
                <select id="year" name="year" value={values.year} onChange={handleChange}>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
                <Icon name="chevronDown" size={16} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="status">Status <span>*</span></label>
              <div className="form-select-wrap">
                <select id="status" name="status" value={values.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <Icon name="chevronDown" size={16} />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <Link className="button button-secondary" to="/students">Cancel</Link>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add student'}
              {!saving && <Icon name={isEditing ? 'check' : 'add'} size={17} />}
            </button>
          </div>
        </form>

        <aside className="form-aside">
          <div className="form-aside-art" aria-hidden="true">
            <span className="aside-sun" />
            <span className="aside-moon" />
            <span className="aside-mountain mountain-back" />
            <span className="aside-mountain mountain-front" />
            <span className="aside-stem" />
            <span className="aside-leaf leaf-one" />
            <span className="aside-leaf leaf-two" />
            <span className="aside-leaf leaf-three" />
          </div>
          <p className="aside-jp">One step at a time</p>
          <h3>Every student has a story.</h3>
          <p className="aside-copy">A thoughtful detail today can make someone feel seen tomorrow.</p>
          <span className="aside-note">A LITTLE NOTE FROM {APP_NAME} <span>✳</span></span>
        </aside>
      </div>
    </section>
  )
}

export default StudentForm
