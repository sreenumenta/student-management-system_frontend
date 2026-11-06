import { useEffect } from 'react'
import Icon from './Icons.jsx'

function ConfirmDialog({ student, onCancel, onConfirm, busy }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [busy, onCancel])

  if (!student) return null

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel()
    }}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
      >
        <button className="icon-button dialog-close" onClick={onCancel} aria-label="Close dialog" disabled={busy}>
          <Icon name="close" />
        </button>
        <div className="dialog-mark"><Icon name="trash" size={21} /></div>
        <p className="eyebrow">One last check</p>
        <h2 id="delete-title">Remove this student?</h2>
        <p id="delete-description">
          <strong>{student.firstName} {student.lastName}</strong> will be removed from your roster. This can’t be undone.
        </p>
        <div className="dialog-actions">
          <button className="button button-secondary" onClick={onCancel} disabled={busy}>Keep student</button>
          <button className="button button-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Removing…' : 'Delete student'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
