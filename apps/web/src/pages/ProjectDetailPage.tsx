import { useMemo, useState } from 'react'
import './WorkflowPages.css'

type TryRow = {
  id: number
  title: string
  marked: boolean
}

const initialTries: TryRow[] = [
  { id: 1, title: '기준 처방', marked: false },
  { id: 2, title: '신물 억제 후보', marked: false },
  { id: 3, title: '맛 개선 후보', marked: false },
  { id: 4, title: '정제 안정성 후보', marked: false },
  { id: 5, title: '제조 공정 후보', marked: false },
  { id: 6, title: '포장 적합성 후보', marked: false },
]

export function ProjectDetailPage() {
  const [tries, setTries] = useState(initialTries)
  const markedCount = useMemo(() => tries.filter((item) => item.marked).length, [tries])

  function toggleMarked(id: number) {
    setTries((current) =>
      current.map((item) => (item.id === id ? { ...item, marked: !item.marked } : item)),
    )
  }

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>신물 억제 고형제 개발</h2>
          <p>그룹별 try와 테스트 기록을 관리</p>
        </div>
        <strong className="status-pill">의미 있는 Try {markedCount}건</strong>
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>신물 억제 그룹</h3>
          <span>try#1-6</span>
        </div>
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
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => toggleMarked(item.id)}
                    >
                      try#{item.id} 마킹
                    </button>
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
