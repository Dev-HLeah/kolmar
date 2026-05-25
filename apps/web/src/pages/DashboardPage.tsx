import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'
import './DashboardPage.css'

type ApiProductSummary = {
  id: string
  name: string
  function?: string | null
  createdAt?: string | null
  dosageForm?: {
    name?: string | null
  } | null
  formulas?: Array<{
    ingredients?: unknown[]
  }>
}

type ApiProjectSummary = {
  id: string
  name: string
  createdAt?: string | null
  groups?: Array<{
    id?: string
    name?: string | null
    tries?: ApiFormulaTrySummary[]
  }>
}

type ApiFormulaTrySummary = {
  id: string
  tryNumber: number
  title?: string | null
  status?: string | null
  createdAt?: string | null
  marks?: unknown[]
}

type DashboardData = {
  products: ApiProductSummary[]
  projects: ApiProjectSummary[]
}

type MetricTile = {
  label: string
  total: number
  weekly: number
}

type PlannedTryItem = ApiFormulaTrySummary & {
  projectId: string
  projectName: string
  groupName: string
}

const emptyDashboardData: DashboardData = {
  products: [],
  projects: [],
}

const plannedTryStatuses = new Set(['DRAFT', 'PLANNED'])

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(emptyDashboardData)
  const [isApiUnavailable, setIsApiUnavailable] = useState(false)
  const weekRange = useMemo(() => getCurrentWeekRange(), [])
  const plannedTries = useMemo(() => flattenPlannedTries(dashboardData.projects), [dashboardData])
  const weeklyPlannedTries = plannedTries.filter((formulaTry) =>
    isWithinRange(formulaTry.createdAt, weekRange),
  )
  const meaningfulTryCount = plannedTries.filter((formulaTry) => (formulaTry.marks?.length ?? 0) > 0)
    .length
  const metrics: MetricTile[] = [
    {
      label: '등록 제품',
      total: dashboardData.products.length,
      weekly: countWithinRange(dashboardData.products, weekRange),
    },
    {
      label: '진행 프로젝트',
      total: dashboardData.projects.length,
      weekly: countWithinRange(dashboardData.projects, weekRange),
    },
    {
      label: '계획 Try',
      total: plannedTries.length,
      weekly: weeklyPlannedTries.length,
    },
  ]
  const recentProducts = sortByCreatedAt(dashboardData.products).slice(0, 5)
  const recentProjects = sortByCreatedAt(dashboardData.projects).slice(0, 5)

  useEffect(() => {
    let isActive = true

    async function loadDashboardData() {
      try {
        const [products, projects] = await Promise.all([
          apiGet<ApiProductSummary[]>('/products'),
          apiGet<ApiProjectSummary[]>('/projects'),
        ])

        if (!isActive) {
          return
        }

        setDashboardData({ products, projects })
        setIsApiUnavailable(false)
      } catch {
        if (!isActive) {
          return
        }

        setDashboardData(emptyDashboardData)
        setIsApiUnavailable(true)
      }
    }

    void loadDashboardData()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <h2>대시보드</h2>
          <p>등록 제품, 진행 프로젝트, 계획 Try의 전체 현황과 이번 주 움직임</p>
        </div>
        <div className="week-range" aria-label="이번 주 범위">
          <span>전체</span>
          <strong>이번 주 {formatDateRange(weekRange)}</strong>
        </div>
      </section>

      {isApiUnavailable ? (
        <p className="dashboard-alert">API 연결 실패로 현황을 불러오지 못했습니다.</p>
      ) : null}

      <section className="metric-grid" aria-label="전체와 이번 주 현황">
        {metrics.map((metric) => (
          <article
            aria-label={`${metric.label} 전체 ${metric.total} 이번 주 ${metric.weekly}`}
            className="metric-tile"
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.total}</strong>
            <em>이번 주 {metric.weekly}</em>
          </article>
        ))}
      </section>

      <section className="dashboard-summary-grid">
        <section className="dashboard-panel">
          <PanelHeading title="최근 등록 제품" count={`${recentProducts.length}건`} />
          <div className="dashboard-list">
            {recentProducts.length ? (
              recentProducts.map((product) => (
                <Link
                  aria-label={product.name}
                  className="dashboard-list-item"
                  key={product.id}
                  to={`/products/${product.id}`}
                >
                  <strong>{product.name}</strong>
                  <span>
                    {product.dosageForm?.name ?? '제형 미입력'} · {product.function ?? '기능성 미입력'} · 원료{' '}
                    {product.formulas?.[0]?.ingredients?.length ?? 0}개
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState text="등록 제품이 없습니다." />
            )}
          </div>
        </section>

        <section className="dashboard-panel">
          <PanelHeading title="최근 생성 프로젝트" count={`${recentProjects.length}건`} />
          <div className="dashboard-list">
            {recentProjects.length ? (
              recentProjects.map((project) => (
                <Link
                  aria-label={project.name}
                  className="dashboard-list-item"
                  key={project.id}
                  to={`/projects/${project.id}`}
                >
                  <strong>{project.name}</strong>
                  <span>
                    그룹 {project.groups?.length ?? 0}개 · Try {countProjectTries(project)}개
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState text="진행 프로젝트가 없습니다." />
            )}
          </div>
        </section>

        <section className="dashboard-panel wide">
          <PanelHeading title="이번 주 계획 Try" count={`${weeklyPlannedTries.length}건`} />
          <div className="dashboard-table-wrap">
            {weeklyPlannedTries.length ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Try</th>
                    <th>프로젝트</th>
                    <th>그룹</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyPlannedTries.map((formulaTry) => (
                    <tr key={formulaTry.id}>
                      <td>try#{formulaTry.tryNumber} {formulaTry.title ?? '제목 미입력'}</td>
                      <td>
                        <Link to={`/projects/${formulaTry.projectId}`}>{formulaTry.projectName}</Link>
                      </td>
                      <td>{formulaTry.groupName}</td>
                      <td>{toTryStatusLabel(formulaTry.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState text="이번 주 계획 Try가 없습니다." />
            )}
          </div>
        </section>

        <section className="dashboard-panel compact-panel">
          <PanelHeading title="의미 있는 Try" count={`${meaningfulTryCount}건`} />
          <p className="dashboard-note">마킹된 Try 기준입니다. 후보 검토는 프로젝트 상세에서 이어서 진행합니다.</p>
        </section>
      </section>
    </div>
  )
}

function PanelHeading({ title, count }: { title: string; count: string }) {
  return (
    <div className="panel-heading">
      <h3>{title}</h3>
      <span>{count}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="dashboard-empty">{text}</p>
}

function getCurrentWeekRange() {
  const now = new Date()
  const start = new Date(now)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function formatDateRange(range: { start: Date; end: Date }) {
  return `${formatDate(range.start)} - ${formatDate(range.end)}`
}

function formatDate(date: Date) {
  return `${date.getFullYear()}.${padDatePart(date.getMonth() + 1)}.${padDatePart(date.getDate())}`
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

function countWithinRange(items: Array<{ createdAt?: string | null }>, range: { start: Date; end: Date }) {
  return items.filter((item) => isWithinRange(item.createdAt, range)).length
}

function isWithinRange(value: string | null | undefined, range: { start: Date; end: Date }) {
  if (!value) {
    return false
  }

  const date = new Date(value)
  return date >= range.start && date <= range.end
}

function sortByCreatedAt<T extends { createdAt?: string | null }>(items: T[]) {
  return [...items].sort((left, right) => getTime(right.createdAt) - getTime(left.createdAt))
}

function getTime(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0
}

function flattenPlannedTries(projects: ApiProjectSummary[]): PlannedTryItem[] {
  return projects.flatMap((project) =>
    (project.groups ?? []).flatMap((group) =>
      (group.tries ?? [])
        .filter((formulaTry) => plannedTryStatuses.has(formulaTry.status ?? ''))
        .map((formulaTry) => ({
          ...formulaTry,
          projectId: project.id,
          projectName: project.name,
          groupName: group.name ?? '그룹명 미입력',
        })),
    ),
  )
}

function countProjectTries(project: ApiProjectSummary) {
  return (project.groups ?? []).reduce((total, group) => total + (group.tries?.length ?? 0), 0)
}

function toTryStatusLabel(status: string | null | undefined) {
  if (status === 'PLANNED') {
    return '계획'
  }

  if (status === 'DRAFT') {
    return '초안'
  }

  return status ?? '상태 미입력'
}
