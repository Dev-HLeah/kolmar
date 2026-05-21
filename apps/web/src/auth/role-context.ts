import { createContext, useContext } from 'react'
import { DEFAULT_USER_ROLE, type UserRole } from './roles'

export type RoleContextValue = {
  role: UserRole
  setRole: (role: UserRole) => void
}

export const RoleContext = createContext<RoleContextValue>({
  role: DEFAULT_USER_ROLE,
  setRole: () => undefined,
})

export function useRole() {
  return useContext(RoleContext)
}
