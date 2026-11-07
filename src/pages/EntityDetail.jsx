import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import { ENTITY_CONFIG } from '../config/entities.js'
import { getRecord, getRecords } from '../services/api.js'

function formatValue(value, field) {
  if (value === null || value === undefined || value === '') return '—'
  if (field.type === 'number' && field.name === 'fees') {
    const amount = Number(value)
    return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : value
  }
  return String(value)
}

function formatCreatedAt(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function EntityDetail({ resource }) {
  const config = ENTITY_CONFIG[resource]
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [relations, setRelations] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const title = config.plural[0].toUpperCase() + config.plural.slice(1)

  useEffect(() => {
    let active = true

    async function loadRecord() {
      try {
        const relationResources = [...new Set(config.fields
          .filter((field) => field.type === 'relation')
          .map((field) => field.resource))]
        const [item, ...relatedResults] = await Promise.all([
          getRecord(resource, id),
          ...relationResources.map((relation) => getRecords(relation)),
        ])
        if (!active) return
        setRecord(item)
        setRelations(Object.fromEntries(relationResources.map((name, index) => [
          name,
          relatedResults[index],
        ])))
        setError('')
      } catch (loadError) {
        if (!active) return
        setError(loadError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRecord()
    return () => { active = false }
  }, [config, id, resource])

  function getFieldValue(field) {
    const value = record[field.name]
    if (field.type !== 'relation') return formatValue(value, field)
    const relationId = value && typeof value === 'object' ? value.id : value
    const relatedRecord = (relations[field.resource] || []).find(
      (item) => String(item.id) === String(relationId),
    )
    return relatedRecord
      ? `${relatedRecord[field.displayField]} (#${relationId})`
      : relationId ? `#${relationId}` : '—'
  }

  return (
    <section className="form-page">
      <div className="breadcrumb">
        <Link to={`/${resource}`}>{title}</Link>
        <span className="breadcrumb-slash">/</span>
        <span className="breadcrumb-current">Record details</span>
      </div>

      <div className="form-heading">
        <Link className="back-link" to={`/${resource}`}><Icon name="arrowLeft" size={17} /> Back to {config.plural}</Link>
        <p className="eyebrow"><span className="eyebrow-line" /> {config.eyebrow}</p>
        <h1>{loading ? `Loading ${config.singular}` : record?.[config.nameField] || `${config.singular} #${id}`}<span className="heading-period">.</span></h1>
        <p className="page-description">Record details and information.</p>
      </div>

      {loading ? (
        <div className="form-loading"><span className="skeleton-line skeleton-heading" /><span className="skeleton-line skeleton-medium" /><div className="form-loading-card" /></div>
      ) : error ? (
        <div className="form-error" role="alert">
          <strong>Could not load this {config.singular}.</strong>
          <span>{error}</span>
          <Link className="button button-secondary button-small" to={`/${resource}`}>Back to {config.plural}</Link>
        </div>
      ) : (
        <section className="student-form entity-form detail-card" aria-label={`${config.singular} details`}>
          <div className="form-section-heading">
            <span className="section-index">01</span>
            <div><h2>{config.singular[0].toUpperCase()}{config.singular.slice(1)} details</h2><p>Record ID #{record.id}</p></div>
          </div>
          <dl className="detail-grid">
            {config.fields.map((field) => (
              <div className="detail-field" key={field.name}>
                <dt>{field.label}</dt>
                <dd>{getFieldValue(field)}</dd>
              </div>
            ))}
            <div className="detail-field">
              <dt>Created</dt>
              <dd>{formatCreatedAt(record.created_at)}</dd>
            </div>
          </dl>
          <div className="form-actions">
            <Link className="button button-secondary" to={`/${resource}`}>Back to {config.plural}</Link>
            <Link className="button button-primary" to={`/${resource}/${record.id}/edit`}>
              Edit {config.singular}<Icon name="edit" size={17} />
            </Link>
          </div>
        </section>
      )}
    </section>
  )
}

export default EntityDetail
