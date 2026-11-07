import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import { ENTITY_CONFIG } from '../config/entities.js'
import { deleteRecord } from '../services/api.js'

function EntityManage({ resource }) {
  const config = ENTITY_CONFIG[resource]
  const { showToast } = useOutletContext()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [recordToDelete, setRecordToDelete] = useState('')
  const [deleting, setDeleting] = useState(false)
  const title = config.plural[0].toUpperCase() + config.plural.slice(1)
  const validId = /^\d+$/.test(id) && Number(id) > 0

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRecord(resource, recordToDelete)
      showToast(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} #${recordToDelete} was deleted.`, 'ok')
      setRecordToDelete('')
      setId('')
    } catch (error) {
      showToast(`Could not delete this ${config.singular}. ${error.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="form-page">
      <div className="breadcrumb"><Link to={`/${resource}`}>{title}</Link><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">Manage by ID</span></div>
      <div className="form-heading">
        <Link className="back-link" to={`/${resource}`}><Icon name="arrowLeft" size={17} /> Back to {config.plural}</Link>
        <p className="eyebrow"><span className="eyebrow-line" /> API MANAGEMENT</p>
        <h1>Manage {config.singular}<span className="heading-period">.</span></h1>
        <p className="page-description">The API does not provide a readable {config.singular} list. Enter its ID to update or delete it.</p>
      </div>

      <div className="student-form entity-form">
        <div className="form-section-heading">
          <span className="section-index">01</span>
          <div><h2>Record ID</h2><p>Use PATCH to update selected fields or PUT to replace all fields.</p></div>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="record-id">{config.singular[0].toUpperCase()}{config.singular.slice(1)} ID <span>*</span></label>
            <input
              id="record-id"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder={`Enter ${config.singular} ID`}
            />
          </div>
        </div>
        <div className="form-actions">
          <Link className="button button-secondary" to={`/${resource}`}>Cancel</Link>
          <button
            className="button button-secondary"
            type="button"
            disabled={!validId}
            onClick={() => setRecordToDelete(id)}
          >
            <Icon name="trash" size={17} />
            Delete by ID
          </button>
          <button
            className="button button-primary"
            type="button"
            disabled={!validId}
            onClick={() => navigate(`/${resource}/${id}/edit`)}
          >
            <Icon name="edit" size={17} />
            Update by ID
          </button>
        </div>
      </div>

      {recordToDelete && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleting) setRecordToDelete('')
        }}>
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <button className="icon-button dialog-close" onClick={() => setRecordToDelete('')} aria-label="Close dialog" disabled={deleting}><Icon name="close" /></button>
            <div className="dialog-mark"><Icon name="trash" size={21} /></div>
            <p className="eyebrow">One last check</p>
            <h2 id="delete-title">Delete this {config.singular}?</h2>
            <p>The record with ID <strong>{recordToDelete}</strong> will be permanently removed. This can’t be undone.</p>
            <div className="dialog-actions">
              <button className="button button-secondary" onClick={() => setRecordToDelete('')} disabled={deleting}>Cancel</button>
              <button className="button button-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : `Delete ${config.singular}`}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default EntityManage
