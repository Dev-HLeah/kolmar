import './FormulaInputTable.css'

export type FormulaRow = {
  ingredientName: string
  amount: string
  unit: string
  ratio: string
  note: string
}

type Props = {
  rows: FormulaRow[]
  onChange: (rows: FormulaRow[]) => void
}

const emptyRow: FormulaRow = {
  ingredientName: '',
  amount: '',
  unit: 'mg',
  ratio: '',
  note: '',
}

export function FormulaInputTable({ rows, onChange }: Props) {
  function updateRow(index: number, key: keyof FormulaRow, value: string) {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)))
  }

  function addRow() {
    onChange([...rows, { ...emptyRow }])
  }

  function removeRow(index: number) {
    if (rows.length === 1) {
      onChange([{ ...emptyRow }])
      return
    }

    onChange(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <div className="formula-input">
      <div className="formula-toolbar">
        <div>
          <h3>배합 입력</h3>
          <p>원료별 함량, 비율, 메모를 선택적으로 기록</p>
        </div>
        <div className="formula-actions">
          <button type="button" className="secondary-button" disabled aria-label="음성 입력">
            음성 입력
          </button>
          <button type="button" className="primary-button" onClick={addRow}>
            원료 행 추가
          </button>
        </div>
      </div>

      <div className="formula-table-wrap">
        <table className="formula-table">
          <thead>
            <tr>
              <th>원료명</th>
              <th>함량</th>
              <th>단위</th>
              <th>비율</th>
              <th>메모</th>
              <th>
                <span className="sr-only">행 작업</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <label className="sr-only" htmlFor={`ingredient-${index}`}>
                    원료명 {index + 1}
                  </label>
                  <input
                    id={`ingredient-${index}`}
                    value={row.ingredientName}
                    onChange={(event) => updateRow(index, 'ingredientName', event.target.value)}
                    placeholder="예: 비타민 C"
                  />
                </td>
                <td>
                  <label className="sr-only" htmlFor={`amount-${index}`}>
                    함량 {index + 1}
                  </label>
                  <input
                    id={`amount-${index}`}
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(event) => updateRow(index, 'amount', event.target.value)}
                    placeholder="0"
                  />
                </td>
                <td>
                  <label className="sr-only" htmlFor={`unit-${index}`}>
                    단위 {index + 1}
                  </label>
                  <select
                    id={`unit-${index}`}
                    value={row.unit}
                    onChange={(event) => updateRow(index, 'unit', event.target.value)}
                  >
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="%">%</option>
                    <option value="ppm">ppm</option>
                  </select>
                </td>
                <td>
                  <label className="sr-only" htmlFor={`ratio-${index}`}>
                    비율 {index + 1}
                  </label>
                  <input
                    id={`ratio-${index}`}
                    inputMode="decimal"
                    value={row.ratio}
                    onChange={(event) => updateRow(index, 'ratio', event.target.value)}
                    placeholder="%"
                  />
                </td>
                <td>
                  <label className="sr-only" htmlFor={`note-${index}`}>
                    메모 {index + 1}
                  </label>
                  <input
                    id={`note-${index}`}
                    value={row.note}
                    onChange={(event) => updateRow(index, 'note', event.target.value)}
                    placeholder="역할, 맛, 색, 이슈"
                  />
                </td>
                <td>
                  <button type="button" className="text-button" onClick={() => removeRow(index)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
