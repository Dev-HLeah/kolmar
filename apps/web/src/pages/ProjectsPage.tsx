import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPost } from '../api/client'
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
}

type ApiExperimentGroup = {
  id: string
  name: string
  tries?: unknown[]
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

const projectSourceOptions = [
  { id: 'sample-1', label: '콜마 고형제 기준 처방' },
  { id: '', label: '선택 안 함' },
]

const localOnlyNotice = 'API 연결 실패로 로컬 화면에만 반영됐습니다.'

export function ProjectsPage() {
  const [name, setName] = useState('')
  const [sourceProductId, setSourceProductId] = useState('sample-1')
  const [groupName, setGroupName] = useState('신물 억제')
  const [projects, setProjects] = useState(seededProjects)
  const [notice, setNotice] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const draftProject: ProjectDraft = {
      id: `draft-project-${projects.length + 1}`,
      name: name.trim() || '신규 프로젝트',
      source: sourceLabel(sourceProductId),
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
        sourceFormulaId: null,
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

      setProjects((current) => [
        {
          id: createdProject.id,
          name: createdProject.name,
          source: sourceLabel(createdProject.sourceProductId ?? sourceProductId),
          groupName: createdGroup.name.trim() || draftProject.groupName,
          tryCount: createdGroup.tries?.length ?? 0,
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
                {projectSourceOptions.map((source) => (
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

function sourceLabel(sourceProductId?: string | null) {
  return (
    projectSourceOptions.find((source) => source.id === (sourceProductId ?? ''))?.label ??
    '선택 안 함'
  )
}

function nullableText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
