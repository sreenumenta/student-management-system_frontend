import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import { ENTITY_CONFIG } from '../config/entities.js'
import { createRecord, getRecord, getRecords, patchRecord, replaceRecord } from '../services/api.js'

function getInitialValues(fields, presetValues = {}) {
  const presets = presetValues && typeof presetValues === 'object' ? presetValues : {}
  return Object.fromEntries(fields.map((field) => {
    const value = presets[field.name]
    return [field.name, value === null || value === undefined ? '' : String(value)]
  }))
}

function getRelationId(value) {
  return value && typeof value === 'object' ? value.id : value
}

function validate(values, fields, partial = false) {
  const errors = {}
  for (const field of fields) {
    const value = values[field.name]
    const empty = value === null || value === undefined || String(value).trim() === ''
    if (empty && partial) continue
    if (empty) {
      errors[field.name] = `${field.label} is required.`
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      errors[field.name] = 'Enter a valid email address.'
    } else if (field.type === 'number') {
      const amount = Number(value)
      const min = field.min === undefined ? 0 : Number(field.min)
      const max = field.max === undefined ? Infinity : Number(field.max)
      const decimalPlaces = value.trim().split('.')[1]?.length || 0
      if (
        !Number.isFinite(amount)
        || amount < min
        || amount > max
        || decimalPlaces > (field.decimalPlaces ?? Infinity)
      ) {
        errors[field.name] = `Enter an amount from ${min} to ${max.toLocaleString('en-IN')} with no more than ${field.decimalPlaces} decimal places.`
      }
    } else if (field.type === 'relation' && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
      errors[field.name] = 'Enter a valid relationship ID.'
    }
  }
  return errors
}

function EntityForm({ resource }) {
  const config = ENTITY_CONFIG[resource]
  const { id } = useParams()
  const location = useLocation()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { showToast } = useOutletContext()
  const [values, setValues] = useState(() => getInitialValues(config.fields, location.state))
  const [createdRecord, setCreatedRecord] = useState(null)
  const [relations, setRelations] = useState({})
  const [relationErrors, setRelationErrors] = useState({})
  const [errors, setErrors] = useState({})
  const [loadedKey, setLoadedKey] = useState('')
  const [loadError, setLoadError] = useState('')
  const [recordUnavailable, setRecordUnavailable] = useState(() => isEditing && !config.readable)
  const [updateMethod, setUpdateMethod] = useState('PUT')
  const [saving, setSaving] = useState(false)
  const formKey = `${resource}:${id || 'new'}`

  useEffect(() => {
    let active = true
    async function loadForm() {
      try {
        const relationResources = [...new Set(config.fields
          .filter((field) => field.type === 'relation')
          .map((field) => field.resource))]
        const readableRelationResources = relationResources.filter(
          (relation) => ENTITY_CONFIG[relation].readable,
        )
        const unavailableRelations = relationResources.filter(
          (relation) => !ENTITY_CONFIG[relation].readable,
        )
        const [recordResult, ...relationResults] = await Promise.all([
          isEditing && config.readable
            ? getRecord(resource, id).then(
              (record) => ({ record }),
              (error) => ({ error }),
            )
            : Promise.resolve({ record: null, unavailable: isEditing }),
          ...readableRelationResources.map((relation) => getRecords(relation).then(
            (records) => ({ records }),
            (error) => ({ error }),
          )),
        ])
        if (!active) return
        let record = recordResult.record
        if (recordResult.unavailable) {
          setRecordUnavailable(true)
          setUpdateMethod('PATCH')
        }
        if (recordResult.error) {
          if (recordResult.error.status !== 405) throw recordResult.error
          setRecordUnavailable(true)
          setUpdateMethod('PATCH')
        }
        const nextRelationErrors = Object.fromEntries([
          ...unavailableRelations.map((name) => [
            name,
            `The API does not provide a ${name} list; enter its ID manually.`,
          ]),
          ...readableRelationResources.flatMap((name, index) => (
          relationResults[index].error ? [[name, relationResults[index].error.message]] : []
          )),
        ])
        setRelationErrors(nextRelationErrors)
        setRelations(Object.fromEntries(readableRelationResources.map((name, index) => [
          name,
          relationResults[index].records || [],
        ])))
        const failedRelations = Object.entries(nextRelationErrors).filter(([name]) => (
          readableRelationResources.includes(name)
        ))
        if (failedRelations.length) {
          showToast(`Could not load related records: ${failedRelations
            .map(([name, message]) => `${name}: ${message}`).join('; ')}. Enter the relationship ID instead.`, 'error')
        }
        if (record) {
          setValues(Object.fromEntries(config.fields.map((field) => {
            const value = field.type === 'relation' ? getRelationId(record[field.name]) : record[field.name]
            return [field.name, value === null || value === undefined ? '' : String(value)]
          })))
        }
        setLoadError('')
      } catch (error) {
        if (!active) return
        setLoadError(error.message)
        showToast(`Could not load this ${config.singular}. ${error.message}`, 'error')
      } finally {
        if (active) setLoadedKey(formKey)
      }
    }

    loadForm()
    return () => { active = false }
  }, [config, formKey, id, isEditing, resource, showToast])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const isPartialUpdate = isEditing && updateMethod === 'PATCH'
    const nextErrors = validate(values, config.fields, isPartialUpdate)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }

    const fieldsToSave = config.fields.filter((field) => (
      !isPartialUpdate || values[field.name].trim() !== ''
    ))
    if (isPartialUpdate && fieldsToSave.length === 0) {
      showToast('Enter at least one field to update.', 'error')
      return
    }
    const data = Object.fromEntries(fieldsToSave.map((field) => {
      const value = values[field.name].trim()
      if (field.type === 'number' || field.type === 'relation') return [field.name, Number(value)]
      return [field.name, value]
    }))

    setSaving(true)
    try {
      if (isEditing) {
        if (isPartialUpdate) {
          await patchRecord(resource, id, data)
        } else {
          await replaceRecord(resource, id, data)
        }
        showToast(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} details saved.`, 'ok')
      } else {
        const created = await createRecord(resource, data)
        showToast(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} #${created.id} added.`, 'ok')
        if (resource === 'students') {
          navigate(`/${resource}`)
        } else {
          setCreatedRecord(created)
          setValues(getInitialValues(config.fields))
          setErrors({})
        }
        return
      }
      navigate(`/${resource}`)
    } catch (error) {
      showToast(`Could not ${isEditing ? 'save' : 'add'} this ${config.singular}. ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const title = config.plural[0].toUpperCase() + config.plural.slice(1)

  if (loadedKey !== formKey) {
    return (
      <section className="form-page">
        <div className="breadcrumb"><Link to={`/${resource}`}>{title}</Link><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">Loading</span></div>
        <div className="form-loading"><span className="skeleton-line skeleton-heading" /><span className="skeleton-line skeleton-medium" /><div className="form-loading-card" /></div>
      </section>
    )
  }

  return (
    <section className="form-page">
      <div className="breadcrumb"><Link to={`/${resource}`}>{title}</Link><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{isEditing ? `Edit ${config.singular}` : `New ${config.singular}`}</span></div>
      <div className="form-heading">
        <Link className="back-link" to={`/${resource}`}><Icon name="arrowLeft" size={17} /> Back to {config.plural}</Link>
        <p className="eyebrow"><span className="eyebrow-line" /> {config.eyebrow}</p>
        <h1>{isEditing ? `Edit ${config.singular}` : `Add a ${config.singular}`}<span className="heading-period">.</span></h1>
        <p className="page-description">{isEditing ? 'Keep the record details up to date.' : 'Enter the details to add a new record.'}</p>
      </div>

      {createdRecord && (
        <div className="creation-receipt" role="status">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> SAVED TO THE API</p>
            <h2>{createdRecord[config.nameField]}</h2>
            <p>Record ID <code>{createdRecord.id}</code>. Keep this ID to link a student to this {config.singular}.</p>
          </div>
          <Link
            className="button button-primary"
            to="/students/new"
            state={{ [resource === 'courses' ? 'course' : 'teacher']: createdRecord.id }}
          >
            Use for a student
          </Link>
        </div>
      )}

      {loadError ? (
        <div className="form-error" role="alert">
          <strong>Could not load this {config.singular}.</strong>
          <span>{loadError}</span>
          <Link className="button button-secondary button-small" to={`/${resource}`}>Back to {config.plural}</Link>
        </div>
      ) : (
        <form className="student-form entity-form" onSubmit={handleSubmit} noValidate>
          {recordUnavailable && (
            <div className="form-error" role="status">
              <strong>This API does not provide a GET endpoint for individual {config.plural}.</strong>
              <span>Enter fields manually. PATCH updates only the fields you fill; PUT replaces the record and requires every field.</span>
            </div>
          )}
          <div className="form-section-heading">
            <span className="section-index">01</span>
            <div><h2>{config.singular[0].toUpperCase()}{config.singular.slice(1)} details</h2><p>All fields are required.</p></div>
          </div>

          {isEditing && (
            <fieldset className="update-method">
              <legend>Update method</legend>
              <label>
                <input type="radio" name="update-method" value="PATCH" checked={updateMethod === 'PATCH'} onChange={() => setUpdateMethod('PATCH')} />
                PATCH — update filled fields only
              </label>
              <label>
                <input type="radio" name="update-method" value="PUT" checked={updateMethod === 'PUT'} onChange={() => setUpdateMethod('PUT')} />
                PUT — replace the whole record
              </label>
            </fieldset>
          )}

          <div className="form-grid">
            {config.fields.map((field) => {
              const errorId = `${field.name}-error`
              const commonProps = {
                id: field.name,
                name: field.name,
                value: values[field.name],
                onChange: handleChange,
                'aria-invalid': Boolean(errors[field.name]),
                'aria-describedby': errors[field.name] ? errorId : undefined,
                required: true,
              }
              return (
                <div className={`form-field${field.type === 'textarea' ? ' form-field-wide' : ''}`} key={field.name}>
                  <label htmlFor={field.name}>
                    {field.type === 'relation' && relationErrors[field.resource] ? `${field.label} ID (lookup unavailable)` : field.label} <span>*</span>
                  </label>
                  {field.type === 'relation' && !relationErrors[field.resource] ? (
                    <div className="form-select-wrap">
                      <select {...commonProps}>
                        <option value="">Select a {field.label.toLowerCase()}</option>
                        {(relations[field.resource] || []).map((record) => (
                          <option key={record.id} value={record.id}>{record[field.displayField]}</option>
                        ))}
                      </select>
                      <Icon name="chevronDown" size={16} />
                    </div>
                  ) : field.type === 'relation' ? (
                    <input
                      {...commonProps}
                      type="number"
                      min="1"
                      step="1"
                      placeholder={`Enter ${field.label.toLowerCase()} ID`}
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea {...commonProps} placeholder={field.placeholder} rows="3" maxLength={field.maxLength} />
                  ) : (
                    <input
                      {...commonProps}
                      type={field.type}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      maxLength={field.maxLength}
                      inputMode={field.type === 'tel' ? 'numeric' : undefined}
                    />
                  )}
                  {errors[field.name] && <span className="field-error" id={errorId}>{errors[field.name]}</span>}
                </div>
              )
            })}
          </div>

          <div className="form-actions">
            <Link className="button button-secondary" to={`/${resource}`}>Cancel</Link>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : `Add ${config.singular}`}
              {!saving && <Icon name={isEditing ? 'check' : 'add'} size={17} />}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function EntityFormRoute({ resource }) {
  const { id } = useParams()
  return <EntityForm key={`${resource}:${id || 'new'}`} resource={resource} />
}

export default EntityFormRoute
