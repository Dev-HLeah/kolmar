import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { AuditLogPage } from '../pages/AuditLogPage'
import { DashboardPage } from '../pages/DashboardPage'
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { ProductsPage } from '../pages/ProductsPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { ProjectsPage } from '../pages/ProjectsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: 'knowledge', element: <KnowledgeBasePage /> },
      { path: 'audit-logs', element: <AuditLogPage /> },
    ],
  },
])
