import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Icon from './Icons.jsx'
import { APP_NAME } from '../config/appConfig.js'

function Layout() {
  const [theme, setTheme] = useState(() => (
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  ))
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)
  const timers = useRef(new Map())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout)
    timers.current.clear()
  }, [])

  const showToast = useCallback((message, type = 'ok') => {
    const id = ++toastId.current
    setToasts((current) => [...current, { id, message, type }])
    timers.current.set(id, window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
      timers.current.delete(id)
    }, 3000))
  }, [])

  function dismissToast(id) {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/students" aria-label={`${APP_NAME} student registry home`}>
          <span className="brand-mark"><span /></span>
          <span className="brand-name">{APP_NAME}<span className="brand-period">.</span></span>
        </NavLink>
        <div className="topbar-right">
          <span className="workspace-label"><span className="online-dot" /> Campus workspace</span>
          <span className="topbar-divider" />
          <button
            className="theme-toggle"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
          <span className="profile-chip" aria-label="Signed in as campus admin">AK</span>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-label">Workspace</div>
          <NavLink to="/students" className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}>
            <span className="nav-grid-icon"><i /><i /><i /><i /></span>
            <span>Students</span>
            <span className="nav-count">09</span>
          </NavLink>
          <div className="sidebar-bottom">
            <div className="season-art" aria-hidden="true">
              <span className="art-sun" />
              <span className="art-hill art-hill-back" />
              <span className="art-hill art-hill-front" />
              <span className="art-wave" />
            </div>
            <p className="season-caption">Garden of learning</p>
            <p className="season-subtitle">A little space to grow.</p>
            <div className="sidebar-credit"><span>SPRING / 2025</span><span>NO. 01</span></div>
          </div>
        </aside>

        <main className="main-content">
          <Outlet context={{ showToast }} />
          <footer className="page-footer">
            <span>Made for the people who make a difference.</span>
            <span className="footer-jp">Learning goes on.</span>
          </footer>
        </main>
      </div>

      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <span className="toast-icon"><Icon name={toast.type === 'ok' ? 'check' : 'close'} size={16} /></span>
            <span>{toast.message}</span>
            <button className="toast-dismiss" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Layout
