import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'
import { CustomSelect } from '../components/CustomSelect'
import './WorkflowPages.css'

type ProjectRow = {
  id: string
  name: string
  source: string
  tryCount: number
  createdAt?: string
}

type ApiProject = {
  id: string
  name: string
  sourceProductId?: string | null
  createdAt?: string
  tries?: unknown[]
}

type ApiProduct = {
  id: string
  name: string
  formulas?: Array<{ id?: string | null }>
}

type ProductSourceOption = {
  id: string
  label: string
  formulaId?: string | null
}

const projectListStateKey = 'kolma:projects-list-state'

function readProjectListState() {
  try {
    const raw = window.sessionStorage.getItem(projectListStateKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { nameSearch?: string; scrollY?: number }
    return { nameSearch: parsed.nameSearch ?? '', scrollY: parsed.scrollY ?? 0 }
  } catch {
    return null
  }
}

const seededProjects: ProjectRow[] = [
  {
    id: 'sample-project',
    name: '신물 억제 고형제 개발',
    source: '콜마 고형제 기준 처방',
    tryCount: 6,
  },
]

const noSourceOption: ProductSourceOption = { id: '', label: '없음', formulaId: null }

const fallbackSourceOptions: ProductSourceOption[] = [
  noSourceOption,
  { id: 'sample-1', label: '콜마 고형제 기준 처방', formulaId: null },
]

const localOnlyNotice = 'API 연결 실패로 로컬 화면에만 반영됐습니다.'

export function ProjectsPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const shouldRestoreList = Boolean(
    (location.state as { restoreProjectsList?: boolean } | null)?.restoreProjectsList,
  )

  const requestedSourceProductId = searchParams.get('sourceProductId') ?? ''
  const [showCreateModal, setShowCreateModal] = useState(Boolean(requestedSourceProductId))
  const [name, setName] = useState('')
  const [background, setBackground] = useState('')
  const [objective, setObjective] = useState('')
  const [sourceOptions, setSourceOptions] = useState(fallbackSourceOptions)
  const [sourceProductId, setSourceProductId] = useState(
    requestedSourceProductId || fallbackSourceOptions[0].id,
  )
  const [projects, setProjects] = useState(seededProjects)
  const [notice, setNotice] = useState('')
  const [nameSearch, setNameSearch] = useState<string>(() =>
    shouldRestoreList ? (readProjectListState()?.nameSearch ?? '') : '',
  )

  useEffect(() => {
    if (shouldRestoreList) {
      const savedState = readProjectListState()
      if (savedState) {
        window.setTimeout(() => window.scrollTo(0, savedState.scrollY), 0)
      }
      return
    }
    window.sessionStorage.removeItem(projectListStateKey)
  }, [shouldRestoreList])

  useEffect(() => {
    let isActive = true

    async function loadData() {
      try {
        const [products, apiProjects] = await Promise.all([
          apiGet<ApiProduct[]>('/products'),
          apiGet<ApiProject[]>('/projects'),
        ])

        if (!isActive) return

        const productNameMap = new Map(products.map((p) => [p.id, p.name]))
        const nextOptions = toSourceOptions(products)
        setSourceOptions(nextOptions)
        setSourceProductId(selectInitialSourceId(nextOptions, requestedSourceProductId))
        setProjects(apiProjects.map((p) => toProjectRow(p, productNameMap)))
        setNotice('')
      } catch {
        if (!isActive) return
        setSourceOptions(fallbackSourceOptions)
        setSourceProductId(selectInitialSourceId(fallbackSourceOptions, requestedSourceProductId))
      }
    }

    void loadData()
    return () => { isActive = false }
  }, [requestedSourceProductId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedSource = findSourceOption(sourceOptions, sourceProductId)

    const draftRow: ProjectRow = {
      id: `draft-${Date.now()}`,
      name: name.trim() || '신규 프로젝트',
      source: sourceLabel(sourceOptions, sourceProductId),
      tryCount: 0,
    }

    try {
      const createdProject = await apiPost<ApiProject, {
        name: string
        background: string | null
        objective: string | null
        sourceProductId: string | null
        sourceFormulaId: string | null
      }>('/projects', {
        name: draftRow.name,
        background: background.trim() || null,
        objective: objective.trim() || null,
        sourceProductId: selectedSource?.id || null,
        sourceFormulaId: selectedSource?.formulaId ?? null,
      })

      setProjects((current) => [
        {
          id: createdProject.id,
          name: createdProject.name,
          source: sourceLabel(sourceOptions, createdProject.sourceProductId ?? sourceProductId),
          tryCount: 0,
        },
        ...current,
      ])
      setNotice('')
    } catch {
      setProjects((current) => [draftRow, ...current])
      setNotice(localOnlyNotice)
    }

    resetForm()
    setShowCreateModal(false)
  }

  function resetForm() {
    setName('')
    setBackground('')
    setObjective('')
  }

  function saveListState() {
    window.sessionStorage.setItem(
      projectListStateKey,
      JSON.stringify({ nameSearch, scrollY: window.scrollY }),
    )
  }

  const filteredProjects = projects.filter((p) =>
    !nameSearch.trim() || p.name.toLowerCase().includes(nameSearch.trim().toLowerCase()),
  )

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>프로젝트</h2>
          <p>제품 개발 기록과 try 목록을 관리</p>
        </div>
        <button
          type="button"
          className="primary-dashboard-button"
          onClick={() => setShowCreateModal(true)}
        >
          + 프로젝트 생성
        </button>
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>프로젝트 목록</h3>
          <span>{filteredProjects.length}건</span>
        </div>
        <div className="product-search-grid" style={{ gridTemplateColumns: '1fr' }}>
          <label>
            프로젝트명 검색
            <input
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="프로젝트명"
            />
          </label>
        </div>
        <div className="workflow-table-wrap">
          <table className="workflow-table">
            <thead>
              <tr>
                <th>프로젝트</th>
                <th>기준 제품</th>
                <th>Try</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link to={`/projects/${project.id}`} onClick={saveListState}>{project.name}</Link>
                  </td>
                  <td>{project.source}</td>
                  <td>{project.tryCount}개</td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    검색 조건에 맞는 프로젝트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showCreateModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="프로젝트 생성"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
        >
          <div className="modal-panel">
            <div className="panel-heading compact">
              <h3>프로젝트 생성</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="닫기"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  프로젝트명
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 눈 건강 연질캡슐 개발"
                    required
                  />
                </label>
                <label>
                  기준 제품
                  <CustomSelect
                    value={sourceProductId}
                    options={sourceOptions.map((s) => ({ value: s.id, label: s.label }))}
                    onChange={setSourceProductId}
                  />
                </label>
                <label className="wide-field">
                  시작 배경
                  <textarea
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    placeholder="예: 한미약품 발주, 소비자 클레임 개선 등"
                    rows={2}
                    required
                  />
                </label>
                <label className="wide-field">
                  개발 목표
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="예: 눈 건강 개선 연질캡슐 처방 확정"
                    rows={2}
                    required
                  />
                </label>
              </div>
              {notice ? <p className="local-notice">{notice}</p> : null}
              <div className="form-actions">
                <span>관리자/연구원</span>
                <button type="submit" className="primary-dashboard-button">
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function toProjectRow(project: ApiProject, productNameMap?: Map<string, string>): ProjectRow {
  return {
    id: project.id,
    name: project.name,
    source: (productNameMap && project.sourceProductId)
      ? (productNameMap.get(project.sourceProductId) ?? '—')
      : '—',
    tryCount: project.tries?.length ?? 0,
    createdAt: project.createdAt,
  }
}

function toSourceOptions(products: ApiProduct[]): ProductSourceOption[] {
  const productOptions = products
    .filter((p) => p.id.trim() && p.name.trim())
    .map((p) => ({
      id: p.id,
      label: p.name,
      formulaId: p.formulas?.[0]?.id ?? null,
    }))

  return [noSourceOption, ...productOptions]
}

function selectInitialSourceId(
  sourceOptions: ProductSourceOption[],
  requestedSourceProductId: string,
) {
  if (requestedSourceProductId && findSourceOption(sourceOptions, requestedSourceProductId)) {
    return requestedSourceProductId
  }
  return sourceOptions[0]?.id ?? ''
}

function sourceLabel(sourceOptions: ProductSourceOption[], sourceProductId?: string | null) {
  return findSourceOption(sourceOptions, sourceProductId ?? '')?.label ?? '—'
}

function findSourceOption(sourceOptions: ProductSourceOption[], sourceProductId: string) {
  return sourceOptions.find((source) => source.id === sourceProductId)
}
