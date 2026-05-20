import { useState } from 'react'
import { FormulaInputTable, type FormulaRow } from '../components/FormulaInputTable'
import './WorkflowPages.css'

const referenceRows: FormulaRow[] = [
  { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '', note: '산미' },
  { ingredientName: '아연', amount: '', unit: 'mg', ratio: '', note: '선택값' },
]

export function ProductDetailPage() {
  const [rows, setRows] = useState(referenceRows)

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>콜마 고형제 기준 처방</h2>
          <p>기존 제품 배합 정보를 기준 자산으로 관리</p>
        </div>
      </section>
      <FormulaInputTable rows={rows} onChange={setRows} />
    </div>
  )
}
