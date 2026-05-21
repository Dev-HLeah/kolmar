import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'
import './WorkflowPages.css'

type ProjectDraft = {
  id: string
  name: string
  source: string
  groupName: string
  tryCount: number
}

type ApiProject = {
  id: string
  name: string
  sourceProductId?: string | null
  sourceFormulaId?: string | null
}

type ApiExperimentGroup = {
  id: string
  name: string
  tries?: unknown[]
}

type ApiProduct = {
  id: string
  name: string
  formulas?: ApiProductFormula[]
}

type ApiProductFormula = {
  id?: string | null
  ingredients?: ApiProductFormulaIngredient[]
}

type ApiProductFormulaIngredient = {
  amount?: string | number | null
  unit?: string | null
  ratio?: string | number | null
  role?: string | null
  ingredient?: {
    name?: string | null
  } | null
}

type ApiFormulaTry = {
  id: string
  tryNumber: number
}

type BaselineTryIngredientPayload = {
  ingredientName: string
  amount: string | number | null
  unit: string | null
  ratio: string | number | null
  note: string | null
}

type ProductSourceOption = {
  id: string
  label: string
  formulaId?: string | null
  formula?: ApiProductFormula | null
}

const seededProjects: ProjectDraft[] = [
  {
    id: 'sample-project',
    name: '신물 억제 고형제 개발',
    source: '콜마 고형제 기준 처방',
    groupName: '신물 억제',
    tryCount: 6,
  },
]

const noSourceOption: ProductSourceOption = { id: '', label: '선택 안 함', formulaId: null }

const fallbackSourceOptions: ProductSourceOption[] = [
  { id: 'sample-1', label: '콜마 고형제 기준 처방', formulaId: null },
  noSourceOption,
]

const localOnlyNotice = 'API 연결 실패로 로컬 화면에만 반영됐습니다.'

export function ProjectsPage() {
  const [searchParams] = useSearchParams()
  const requestedSourceProductId = searchParams.get('sourceProductId') ?? ''
  const [name, setName] = useState('')
  const [sourceOptions, setSourceOptions] = useState(fallbackSourceOptions)
  const [sourceProductId, setSourceProductId] = useState(
    requestedSourceProductId || fallbackSourceOptions[0].id,
  )
  const [groupName, setGroupName] = useState('신물 억제')
  const [projects, setProjects] = useState(seededProjects)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadProductSources() {
      try {
        const products = await apiGet<ApiProduct[]>('/products')

        if (!isActive) {
          return
        }

        const nextOptions = toSourceOptions(products)
        setSourceOptions(nextOptions)
        setSourceProductId((current) =>
          selectInitialSourceId(nextOptions, requestedSourceProductId, current),
        )
      } catch {
        if (!isActive) {
          return
        }

        setSourceOptions(fallbackSourceOptions)
        setSourceProductId((current) =>
          selectInitialSourceId(fallbackSourceOptions, requestedSourceProductId, current),
        )
      }
    }

    void loadProductSources()

    return () => {
      isActive = false
    }
  }, [requestedSourceProductId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedSource = findSourceOption(sourceOptions, sourceProductId)

    const draftProject: ProjectDraft = {
      id: `draft-project-${projects.length + 1}`,
      name: name.trim() || '신규 프로젝트',
      source: sourceLabel(sourceOptions, sourceProductId),
      groupName: groupName.trim() || '기본 그룹',
      tryCount: 0,
    }

    try {
      const createdProject = await apiPost<
        ApiProject,
        {
          name: string
          goal: string | null
          target: string | null
          function: string | null
          desiredForm: string | null
          costRange: string | null
          excludedIngredients: string | null
          sourceProductId: string | null
          sourceFormulaId: string | null
        }
      >('/projects', {
        name: draftProject.name,
        goal: null,
        target: null,
        function: null,
        desiredForm: '정제',
        costRange: null,
        excludedIngredients: null,
        sourceProductId: nullableText(sourceProductId),
        sourceFormulaId: selectedSource?.formulaId ?? null,
      })

      const createdGroup = await apiPost<
        ApiExperimentGroup,
        {
          name: string
          purpose: string | null
        }
      >(`/projects/${createdProject.id}/groups`, {
        name: draftProject.groupName,
        purpose: null,
      })
      const createdBaselineTry = selectedSource?.formulaId
        ? await apiPost<
            ApiFormulaTry,
            {
              tryNumber: number
              status: 'DRAFT'
              title: string
              memo: string
              ingredients: BaselineTryIngredientPayload[]
            }
          >(`/projects/groups/${createdGroup.id}/tries`, {
            tryNumber: 1,
            status: 'DRAFT',
            title: '기준 처방',
            memo: `${selectedSource.label}에서 복사한 기준 Try입니다.`,
            ingredients: toBaselineTryIngredients(selectedSource.formula),
          })
        : null

      setProjects((current) => [
        {
          id: createdProject.id,
          name: createdProject.name,
          source: sourceLabel(sourceOptions, createdProject.sourceProductId ?? sourceProductId),
          groupName: createdGroup.name.trim() || draftProject.groupName,
          tryCount: createdBaselineTry ? 1 : createdGroup.tries?.length ?? 0,
        },
        ...current,
      ])
      setNotice('')
    } catch {
      setProjects((current) => [draftProject, ...current])
      setNotice(localOnlyNotice)
    }

    setName('')
  }

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>프로젝트</h2>
          <p>제품 개발 그룹과 try 목록을 관리</p>
        </div>
      </section>

      <section className="workflow-grid">
        <form className="workflow-panel" onSubmit={handleSubmit}>
          <div className="panel-heading compact">
            <h3>프로젝트 생성</h3>
            <span>기존 제품 기반</span>
          </div>
          <div className="form-grid">
            <label>
              프로젝트명
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              기준 제품
              <select
                value={sourceProductId}
                onChange={(event) => setSourceProductId(event.target.value)}
              >
                {sourceOptions.map((source) => (
                  <option key={source.label} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              그룹명
              <input value={groupName} onChange={(event) => setGroupName(event.target.value)} />
            </label>
          </div>
          {notice ? <p className="local-notice">{notice}</p> : null}
          <div className="form-actions">
            <span>관리자/연구원</span>
            <button type="submit" className="primary-dashboard-button">
              프로젝트 생성
            </button>
          </div>
        </form>

        <section className="workflow-panel">
          <div className="panel-heading compact">
            <h3>프로젝트 목록</h3>
            <span>{projects.length}건</span>
          </div>
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>프로젝트</th>
                  <th>기준</th>
                  <th>그룹</th>
                  <th>Try</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link to={`/projects/${project.id}`}>{project.name}</Link>
                    </td>
                    <td>{project.source}</td>
                    <td>{project.groupName}</td>
                    <td>{project.tryCount}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  )
}

function toSourceOptions(products: ApiProduct[]): ProductSourceOption[] {
  const productOptions = products
    .filter((product) => product.id.trim() && product.name.trim())
    .map((product) => ({
      id: product.id,
      label: product.name,
      formulaId: product.formulas?.[0]?.id ?? null,
      formula: product.formulas?.[0] ?? null,
    }))

  return [...productOptions, noSourceOption]
}

function toBaselineTryIngredients(
  formula?: ApiProductFormula | null,
): BaselineTryIngredientPayload[] {
  return (formula?.ingredients ?? [])
    .map((ingredient) => ({
      ingredientName: ingredient.ingredient?.name?.trim() ?? '',
      amount: ingredient.amount ?? null,
      unit: ingredient.unit ?? null,
      ratio: ingredient.ratio ?? null,
      note: ingredient.role ?? null,
    }))
    .filter((ingredient) => ingredient.ingredientName.length > 0)
}

function selectInitialSourceId(
  sourceOptions: ProductSourceOption[],
  requestedSourceProductId: string,
  currentSourceProductId: string,
) {
  if (requestedSourceProductId && findSourceOption(sourceOptions, requestedSourceProductId)) {
    return requestedSourceProductId
  }

  if (findSourceOption(sourceOptions, currentSourceProductId)) {
    return currentSourceProductId
  }

  return sourceOptions[0]?.id ?? ''
}

function sourceLabel(sourceOptions: ProductSourceOption[], sourceProductId?: string | null) {
  return (
    findSourceOption(sourceOptions, sourceProductId ?? '')?.label ??
    '선택 안 함'
  )
}

function findSourceOption(sourceOptions: ProductSourceOption[], sourceProductId: string) {
  return sourceOptions.find((source) => source.id === sourceProductId)
}

function nullableText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
