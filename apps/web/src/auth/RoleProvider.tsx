import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { setApiRole } from '../api/client'
import { RoleContext } from './role-context'
import { DEFAULT_USER_ROLE, isUserRole, type UserRole } from './roles'

const ROLE_STORAGE_KEY = 'kolma:user-role'

function readInitialRole(): UserRole {
  const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY)

  return isUserRole(storedRole) ? storedRole : DEFAULT_USER_ROLE
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(readInitialRole)

  useEffect(() => {
    setApiRole(role)
    window.localStorage.setItem(ROLE_STORAGE_KEY, role)
  }, [role])

  const contextValue = useMemo(
    () => ({
      role,
      setRole,
    }),
    [role],
  )

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>
}
