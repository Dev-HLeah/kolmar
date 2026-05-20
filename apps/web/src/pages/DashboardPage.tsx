import { useState } from 'react'
import { FormulaInputTable, type FormulaRow } from '../components/FormulaInputTable'
import './DashboardPage.css'

const initialRows: FormulaRow[] = [
  { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
  { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
]

const metrics = [
  { label: '등록 제품', value: '0', tone: 'neutral' },
  { label: '진행 프로젝트', value: '0', tone: 'neutral' },
  { label: '계획 Try', value: '0', tone: 'neutral' },
  { label: '근거 자료', value: '0', tone: 'neutral' },
]

const kolmarForms = [
  '츄어블 정제',
  '이중 제형 정제',
  '미니/멀티 정제',
  '쿨멜팅 분말',
  '크런치 분말',
  '팝핑 분말',
  '스틱 포장',
  'Multi PTP',
]

export function DashboardPage() {
  const [rows, setRows] = useState(initialRows)

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <h2>연구 대시보드</h2>
          <p>제품 자산, 신규 프로젝트, 배합 Try를 한 흐름에서 관리</p>
        </div>
        <button type="button" className="primary-dashboard-button">
          신규 프로젝트
        </button>
      </section>

      <section className="metric-grid" aria-label="업무 현황">
        {metrics.map((metric) => (
          <figure className="metric-tile" key={metric.label}>
            <figcaption>{metric.label}</figcaption>
            <strong>{metric.value}</strong>
          </figure>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel wide">
          <FormulaInputTable rows={rows} onChange={setRows} />
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <h3>고형제 제형</h3>
            <span>Kolmar 특화</span>
          </div>
          <div className="tag-list">
            {kolmarForms.map((form) => (
              <span key={form}>{form}</span>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <h3>Try 기본값</h3>
            <span>선택 입력</span>
          </div>
          <div className="try-defaults">
            <label>
              그룹명
              <input placeholder="예: 신물 억제" />
            </label>
            <label>
              생성 개수
              <input inputMode="numeric" placeholder="100" />
            </label>
            <label>
              기준 제형
              <select defaultValue="tablet">
                <option value="tablet">정제</option>
                <option value="powder">분말</option>
              </select>
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}
