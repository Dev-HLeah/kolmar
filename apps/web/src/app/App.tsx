import { RouterProvider } from 'react-router-dom'
import { RoleProvider } from '../auth/RoleProvider'
import { router } from './routes'

export function App() {
  return (
    <RoleProvider>
      <RouterProvider router={router} />
    </RoleProvider>
  )
}
