import { NavLink, Outlet } from 'react-router-dom'
import { useRole } from '../auth/role-context'
import { USER_ROLE_LABELS, USER_ROLES, type UserRole } from '../auth/roles'
import './Layout.css'

type NavItem = {
  to: string
  label: string
  end?: boolean
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/', label: '대시보드', end: true },
  { to: '/products', label: '제품/처방' },
  { to: '/projects', label: '프로젝트' },
  { to: '/knowledge', label: '근거 검색' },
  { to: '/audit-logs', label: '운영 로그', roles: ['admin'] },
]

export function Layout() {
  const { role, setRole } = useRole()

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
          {navItems
            .filter((item) => !item.roles || item.roles.includes(role))
            .map((item) => (
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
          <label className="role-control">
            <span>접근 역할</span>
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              {USER_ROLES.map((item) => (
                <option key={item} value={item}>
                  {USER_ROLE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
