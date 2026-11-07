import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import Icon from '../components/Icons.jsx'
import { ENTITY_CONFIG } from '../config/entities.js'
import { deleteRecord, getRecords } from '../services/api.js'

const PAGE_SIZE = 8

function getRelationLabel(value, resource, displayField, relatedRecords) {
  if (value && typeof value === 'object') return value[displayField] || value.name || `#${value.id}`
  const related = relatedRecords.find((record) => String(record.id) === String(value))
  return related?.[displayField] || (value ? `#${value}` : '—')
}

function EntityList({ resource }) {
  const config = ENTITY_CONFIG[resource]
  const { showToast } = useOutletContext()
  const [records, setRecords] = useState([])
  const [relatedRecords, setRelatedRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [readErrorUnsupported, setReadErrorUnsupported] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!config.readable) return undefined

    let active = true
    async function load() {
      try {
        const relationResources = [...new Set(config.columns
          .filter((column) => column.kind === 'relation')
          .map((column) => column.resource))]
          .filter((relation) => ENTITY_CONFIG[relation].readable)
        const items = await getRecords(resource)
        if (!active) return
        const relationResults = await Promise.allSettled(relationResources.map((relation) => getRecords(relation)))
        if (!active) return
        const failedRelations = relationResults.flatMap((result, index) => (
          result.status === 'rejected' ? [`${relationResources[index]}: ${result.reason.message}`] : []
        ))
        setRecords(items)
        setRelatedRecords(Object.fromEntries(relationResources.map((name, index) => [
          name,
          relationResults[index].status === 'fulfilled' ? relationResults[index].value : [],
        ])))
        setLoadError('')
        if (failedRelations.length) {
          showToast(`Could not load related ${failedRelations.join('; ')}. Relationship IDs will be shown instead.`, 'error')
        }
      } catch (error) {
        if (!active) return
        setLoadError(error.message)
        setReadErrorUnsupported(error.status === 405)
        if (error.status !== 405) showToast(`Could not load ${config.plural}. ${error.message}`, 'error')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [config, resource, showToast])

  useEffect(() => {
    if (!recordToDelete || deleting) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') setRecordToDelete(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [recordToDelete, deleting])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return records
    return records.filter((record) => {
      const searchableValues = config.columns.flatMap((column) => {
        if (column.kind === 'relation') {
          return [getRelationLabel(
            record[column.field],
            column.resource,
            column.displayField,
            relatedRecords[column.resource] || [],
          )]
        }
        return [record[column.field] ?? record[config.nameField]]
      })
      searchableValues.push(...Object.values(record).filter((value) => typeof value === 'string'))
      return searchableValues.some((value) => String(value).toLowerCase().includes(query))
    })
  }, [config, records, relatedRecords, search])

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const isLoading = config.readable && loading
  const readUnsupported = !config.readable || readErrorUnsupported
  const listError = config.readable
    ? loadError
    : `The API does not provide a GET endpoint for ${config.plural}.`

  async function handleDelete() {
    if (!recordToDelete) return
    setDeleting(true)
    try {
      await deleteRecord(resource, recordToDelete.id)
      setRecords((current) => current.filter((record) => record.id !== recordToDelete.id))
      showToast(`${recordToDelete[config.nameField]} was deleted.`, 'ok')
      setRecordToDelete(null)
    } catch (error) {
      showToast(`Could not delete this ${config.singular}. ${error.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  function getIdentity(record, column) {
    const name = record[config.nameField] || `${config.singular} #${record.id}`
    const [firstName, ...lastParts] = name.split(/\s+/)
    const lastName = lastParts.join(' ')
    const secondary = record[column.secondaryField]
    return (
      <div className="student-cell">
        <Avatar firstName={firstName} lastName={lastName} />
        <span className="student-identity">
          <strong>{name}</strong>
          <span>{secondary || `ID ${record.id}`}</span>
        </span>
      </div>
    )
  }

  function getCellValue(record, column) {
    if (column.kind === 'identity') return getIdentity(record, column)
    if (column.kind === 'relation') {
      return getRelationLabel(
        record[column.field],
        column.resource,
        column.displayField,
        relatedRecords[column.resource] || [],
      )
    }
    if (column.kind === 'currency') {
      const amount = Number(record[column.field])
      return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '—'
    }
    return record[column.field] ?? '—'
  }

  const title = config.plural[0].toUpperCase() + config.plural.slice(1)

  return (
    <section className="students-page">
      <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{title}</span></div>
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> {config.eyebrow}</p>
          <h1>{config.title}<span className="heading-period">.</span></h1>
          <p className="page-description">{config.description}</p>
        </div>
        <Link className="button button-primary" to={`/${resource}/new`}>
          <Icon name="add" size={18} />
          Add {config.singular}
        </Link>
      </div>

      <section className="directory-panel">
        <div className="directory-top">
          <div>
            <div className="section-title-row">
              <span className="section-index">01</span>
              <h2>All {config.plural}</h2>
            </div>
            <p className="section-caption">Manage your campus records in one place.</p>
          </div>
          <span className="record-count">{filteredRecords.length} {filteredRecords.length === 1 ? config.singular : config.plural}</span>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <span className="visually-hidden">Search {config.plural}</span>
            <input
              type="search"
              placeholder={`Search ${config.plural}…`}
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            />
            {search && <button className="search-clear" onClick={() => { setSearch(''); setPage(1) }} aria-label="Clear search"><Icon name="close" size={15} /></button>}
          </label>
        </div>

        <div className="table-scroll">
          <table className="student-table">
            <thead>
              <tr>
                {config.columns.map((column) => <th scope="col" key={column.label}>{column.label}</th>)}
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }, (_, index) => (
                <tr className="skeleton-row" key={`skeleton-${index}`}>
                  <td><span className="skeleton-avatar" /><span className="skeleton-line skeleton-name" /><span className="skeleton-line skeleton-email" /></td>
                  {config.columns.slice(1).map((column) => <td key={column.label}><span className="skeleton-line skeleton-medium" /></td>)}
                  <td><span className="skeleton-line skeleton-actions" /></td>
                </tr>
              )) : visibleRecords.map((record) => (
                <tr key={record.id}>
                  {config.columns.map((column) => (
                    <td key={column.label}>{getCellValue(record, column)}</td>
                  ))}
                  <td>
                    <div className="row-actions">
                      <Link className="icon-button" to={`/${resource}/${record.id}`} aria-label={`View ${record[config.nameField]}`} title={`View ${config.singular}`}><Icon name="eye" size={17} /></Link>
                      <Link className="icon-button" to={`/${resource}/${record.id}/edit`} aria-label={`Edit ${record[config.nameField]}`} title={`Edit ${config.singular}`}><Icon name="edit" size={17} /></Link>
                      <button className="icon-button icon-button-danger" onClick={() => setRecordToDelete(record)} aria-label={`Delete ${record[config.nameField]}`} title={`Delete ${config.singular}`}><Icon name="trash" size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && listError && (
            <div className="empty-state">
              <div className="empty-mark"><Icon name="more" size={24} /></div>
              <h3>{readUnsupported ? `${title} listing is not enabled by the API` : 'We couldn’t open the directory'}</h3>
              <p>{readUnsupported
                ? `The API does not provide a GET endpoint for /api/${resource}/. You can still add records and manage an existing record by its ID.`
                : listError}</p>
              {readUnsupported && (
                <Link className="button button-secondary button-small" to={`/${resource}/manage`}>Manage by ID</Link>
              )}
              {readUnsupported && (
                <Link className="button button-primary button-small" to={`/${resource}/new`}><Icon name="add" size={16} />Add {config.singular}</Link>
              )}
            </div>
          )}
          {!isLoading && !listError && visibleRecords.length === 0 && (
            <div className="empty-state">
              <div className="empty-mark"><Icon name="search" size={23} /></div>
              <h3>{records.length ? `No ${config.plural} found` : `Your ${config.singular} directory is ready`}</h3>
              <p>{records.length ? 'Try another search.' : `Add your first ${config.singular} to get started.`}</p>
              {records.length === 0 && <Link className="button button-primary button-small" to={`/${resource}/new`}><Icon name="add" size={16} />Add {config.singular}</Link>}
            </div>
          )}
        </div>

        <div className="table-footer">
          <span className="pagination-summary">
            {filteredRecords.length === 0 ? `Showing 0 ${config.plural}` : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredRecords.length)} of ${filteredRecords.length} ${config.plural}`}
          </span>
          <div className="pagination">
            <button className="page-button page-arrow" disabled={currentPage <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><Icon name="arrowLeft" size={16} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button key={number} className={`page-button${number === currentPage ? ' page-current' : ''}`} onClick={() => setPage(number)} disabled={isLoading} aria-label={`Page ${number}`} aria-current={number === currentPage ? 'page' : undefined}>{number}</button>
            ))}
            <button className="page-button page-arrow" disabled={currentPage >= pageCount || isLoading} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><Icon name="arrowLeft" className="arrow-next" size={16} /></button>
          </div>
        </div>
      </section>

      {recordToDelete && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleting) setRecordToDelete(null)
        }}>
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <button className="icon-button dialog-close" onClick={() => setRecordToDelete(null)} aria-label="Close dialog" disabled={deleting}><Icon name="close" /></button>
            <div className="dialog-mark"><Icon name="trash" size={21} /></div>
            <p className="eyebrow">One last check</p>
            <h2 id="delete-title">Delete this {config.singular}?</h2>
            <p><strong>{recordToDelete[config.nameField]}</strong> will be permanently removed. This can’t be undone.</p>
            <div className="dialog-actions">
              <button className="button button-secondary" onClick={() => setRecordToDelete(null)} disabled={deleting}>Cancel</button>
              <button className="button button-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : `Delete ${config.singular}`}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default EntityList
