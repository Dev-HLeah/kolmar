import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPost } from '../api/client'
import './WorkflowPages.css'

type TryRow = {
  id: number
  apiId?: string
  title: string
  marked: boolean
}

type ApiFormulaTry = {
  id: string
  tryNumber: number
  title?: string | null
  marks?: unknown[]
}

type ApiTryMark = {
  id: string
  type: string
}

type ApiExperimentGroup = {
  id: string
  name: string
  tries?: ApiFormulaTry[]
}

type ApiProject = {
  id: string
  name: string
  goal?: string | null
  function?: string | null
  desiredForm?: string | null
  groups?: ApiExperimentGroup[]
}

const sampleGroupId = 'sample-group'
const localOnlyNotice = 'API 연결 실패로 로컬 화면에만 반영됐습니다.'
const fallbackNotice = 'API 연결 실패로 샘플 프로젝트를 표시합니다.'

const initialTries: TryRow[] = [
  { id: 1, apiId: 'sample-try-1', title: '기준 처방', marked: false },
  { id: 2, apiId: 'sample-try-2', title: '신물 억제 후보', marked: false },
  { id: 3, apiId: 'sample-try-3', title: '맛 개선 후보', marked: false },
  { id: 4, apiId: 'sample-try-4', title: '정제 안정성 후보', marked: false },
  { id: 5, apiId: 'sample-try-5', title: '제조 공정 후보', marked: false },
  { id: 6, apiId: 'sample-try-6', title: '포장 적합성 후보', marked: false },
]

const sampleProjectName = '신물 억제 고형제 개발'
const sampleProjectDescription = '그룹별 try와 테스트 기록을 관리'
const sampleGroupName = '신물 억제 그룹'

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const [projectName, setProjectName] = useState(sampleProjectName)
  const [projectDescription, setProjectDescription] = useState(sampleProjectDescription)
  const [groupName, setGroupName] = useState(sampleGroupName)
  const [activeGroupId, setActiveGroupId] = useState(sampleGroupId)
  const [tries, setTries] = useState(initialTries)
  const [tryTitle, setTryTitle] = useState('')
  const [notice, setNotice] = useState('')
  const markedCount = useMemo(() => tries.filter((item) => item.marked).length, [tries])
  const maxTryNumber = useMemo(
    () => tries.reduce((highest, item) => Math.max(highest, item.id), 0),
    [tries],
  )
  const trySummary = tries.length > 0 ? `try#1-${maxTryNumber}` : 'try 없음'

  useEffect(() => {
    if (!projectId) {
      return
    }

    let isActive = true

    async function loadProject() {
      try {
        const project = await apiGet<ApiProject>(`/projects/${projectId}`)

        if (!isActive) {
          return
        }

        const primaryGroup = project.groups?.[0]

        setProjectName(project.name)
        setProjectDescription(toProjectDescription(project))
        setGroupName(primaryGroup?.name?.trim() || '기본 그룹')
        setActiveGroupId(primaryGroup?.id || sampleGroupId)
        setTries(toTryRows(primaryGroup?.tries ?? []))
        setNotice('')
      } catch {
        if (!isActive) {
          return
        }

        setProjectName(sampleProjectName)
        setProjectDescription(sampleProjectDescription)
        setGroupName(sampleGroupName)
        setActiveGroupId(sampleGroupId)
        setTries(initialTries)
        setNotice(fallbackNotice)
      }
    }

    void loadProject()

    return () => {
      isActive = false
    }
  }, [projectId])

  async function toggleMarked(id: number) {
    const targetTry = tries.find((item) => item.id === id)

    if (!targetTry) {
      return
    }

    if (targetTry.marked) {
      setTries((current) =>
        current.map((item) => (item.id === id ? { ...item, marked: false } : item)),
      )
      setNotice(localOnlyNotice)
      return
    }

    if (!targetTry.apiId) {
      setTries((current) =>
        current.map((item) => (item.id === id ? { ...item, marked: true } : item)),
      )
      setNotice(localOnlyNotice)
      return
    }

    try {
      await apiPost<ApiTryMark, { type: 'PROMISING'; reason: string }>(
        `/projects/tries/${targetTry.apiId}/marks`,
        {
          type: 'PROMISING',
          reason: '의미 있는 시도로 마킹',
        },
      )
      setTries((current) =>
        current.map((item) => (item.id === id ? { ...item, marked: true } : item)),
      )
      setNotice('')
    } catch {
      setTries((current) =>
        current.map((item) => (item.id === id ? { ...item, marked: true } : item)),
      )
      setNotice(localOnlyNotice)
    }
  }

  async function addTry() {
    const nextId = maxTryNumber + 1
    const title = tryTitle.trim() || `try#${nextId}`
    setTryTitle('')

    try {
      const createdTry = await apiPost<
        ApiFormulaTry,
        { tryNumber: number; title: string; status: 'DRAFT' }
      >(`/projects/groups/${activeGroupId}/tries`, {
        tryNumber: nextId,
        title,
        status: 'DRAFT',
      })

      setTries((current) => [
        ...current,
        {
          id: createdTry.tryNumber,
          apiId: createdTry.id,
          title: createdTry.title?.trim() || title,
          marked: false,
        },
      ])
      setNotice('')
    } catch {
      setTries((current) => [...current, { id: nextId, title, marked: false }])
      setNotice(localOnlyNotice)
    }
  }

  async function deleteTry(id: number) {
    const targetTry = tries.find((item) => item.id === id)
    setTries((current) => current.filter((item) => item.id !== id))

    if (!targetTry?.apiId) {
      setNotice(localOnlyNotice)
      return
    }

    try {
      await apiDelete(`/projects/tries/${targetTry.apiId}`)
      setNotice('')
    } catch {
      setNotice(localOnlyNotice)
    }
  }

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>{projectName}</h2>
          <p>{projectDescription}</p>
        </div>
        <strong className="status-pill">의미 있는 Try {markedCount}건</strong>
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>{groupName}</h3>
          <span>{trySummary}</span>
        </div>
        <div className="try-add-form">
          <label>
            Try 목적
            <input value={tryTitle} onChange={(event) => setTryTitle(event.target.value)} />
          </label>
          <button type="button" className="primary-dashboard-button" onClick={addTry}>
            Try 추가
          </button>
        </div>
        {notice ? <p className="local-notice">{notice}</p> : null}
        <div className="workflow-table-wrap">
          <table className="workflow-table">
            <thead>
              <tr>
                <th>Try</th>
                <th>목적</th>
                <th>마킹</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {tries.map((item) => (
                <tr key={item.id}>
                  <td>try#{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.marked ? '마킹됨' : '일반'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="text-action"
                        onClick={() => toggleMarked(item.id)}
                      >
                        try#{item.id} 마킹
                      </button>
                      <button
                        type="button"
                        className="text-action danger"
                        onClick={() => deleteTry(item.id)}
                      >
                        try#{item.id} 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function toProjectDescription(project: ApiProject) {
  const summary = [project.function, project.desiredForm, project.goal]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' · ')

  return summary || sampleProjectDescription
}

function toTryRows(tries: ApiFormulaTry[]): TryRow[] {
  return [...tries]
    .sort((left, right) => left.tryNumber - right.tryNumber)
    .map((item) => ({
      id: item.tryNumber,
      apiId: item.id,
      title: item.title?.trim() || `try#${item.tryNumber}`,
      marked: (item.marks?.length ?? 0) > 0,
    }))
}
