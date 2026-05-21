import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { DashboardPage } from '../pages/DashboardPage'
import { KnowledgeSearchPage } from '../pages/KnowledgeSearchPage'
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
      { path: 'knowledge', element: <KnowledgeSearchPage /> },
    ],
  },
])
