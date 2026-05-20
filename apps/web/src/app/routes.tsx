import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { DashboardPage } from '../pages/DashboardPage'
import { ProductsPage } from '../pages/ProductsPage'
import { ProjectsPage } from '../pages/ProjectsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'projects', element: <ProjectsPage /> },
    ],
  },
])
