import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './WorkflowPages.css'

type ProjectDraft = {
  id: string
  name: string
  source: string
  groupName: string
  tryCount: number
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

export function ProjectsPage() {
  const [name, setName] = useState('')
  const [source, setSource] = useState('콜마 고형제 기준 처방')
  const [groupName, setGroupName] = useState('신물 억제')
  const [tryCount, setTryCount] = useState('100')
  const [projects, setProjects] = useState(seededProjects)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setProjects((current) => [
      {
        id: `draft-project-${current.length + 1}`,
        name: name.trim() || '신규 프로젝트',
        source,
        groupName: groupName.trim() || '기본 그룹',
        tryCount: Number.parseInt(tryCount, 10) || 0,
      },
      ...current,
    ])
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
              <select value={source} onChange={(event) => setSource(event.target.value)}>
                <option value="콜마 고형제 기준 처방">콜마 고형제 기준 처방</option>
                <option value="선택 안 함">선택 안 함</option>
              </select>
            </label>
            <label>
              그룹명
              <input value={groupName} onChange={(event) => setGroupName(event.target.value)} />
            </label>
            <label>
              Try 생성 개수
              <input
                inputMode="numeric"
                value={tryCount}
                onChange={(event) => setTryCount(event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <span>관리자/연구원 입력 가능</span>
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
