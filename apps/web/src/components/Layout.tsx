import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

const navItems = [
  { to: '/', label: '대시보드', end: true },
  { to: '/products', label: '제품/처방' },
  { to: '/projects', label: '프로젝트' },
]

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="주요 메뉴">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <div>
            <strong>Kolma R&amp;D</strong>
            <span>Formula PoC</span>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="workspace-eyebrow">Health Functional Food</span>
            <h1>AI 배합 설계 워크스페이스</h1>
          </div>
          <div className="role-badge">연구원</div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
