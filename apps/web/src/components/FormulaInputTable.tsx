import { type ClipboardEvent, useState } from 'react'
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

const voiceDraftRows = [
  {
    ingredientName: '테아닌',
    amount: '200',
    unit: 'mg',
    status: '원료 후보 확인',
  },
  {
    ingredientName: '아연',
    amount: '8',
    unit: 'mg',
    status: '원료 후보 확인',
  },
]

const recentIngredientStorageKey = 'kolma:recent-ingredients'
const maxRecentIngredientCount = 8
const formulaColumnKeys = ['ingredientName', 'amount', 'unit', 'ratio', 'note'] as const
const supportedUnits = new Set(['mg', 'g', '%', 'ppm'])

type FormulaColumnKey = (typeof formulaColumnKeys)[number]

export function FormulaInputTable({ rows, onChange }: Props) {
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false)
  const [recentIngredients, setRecentIngredients] = useState(readRecentIngredients)

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

  function recordRecentIngredient(ingredientName: string) {
    recordRecentIngredients([ingredientName])
  }

  function recordRecentIngredients(ingredientNames: string[]) {
    const normalizedIngredients = ingredientNames
      .map(normalizeIngredientName)
      .filter((ingredientName) => ingredientName.length > 0)

    if (!normalizedIngredients.length) {
      return
    }

    setRecentIngredients((current) => {
      let next = current

      for (const ingredientName of [...normalizedIngredients].reverse()) {
        next = mergeRecentIngredients(ingredientName, next)
      }

      writeRecentIngredients(next)
      return next
    })
  }

  function handleSpreadsheetPaste(
    rowIndex: number,
    columnKey: FormulaColumnKey,
    event: ClipboardEvent<HTMLInputElement>,
  ) {
    const clipboardText = event.clipboardData.getData('text/plain')

    if (!isSpreadsheetPaste(clipboardText)) {
      return
    }

    const pastedRows = parseSpreadsheetRows(clipboardText)

    if (!pastedRows.length) {
      return
    }

    event.preventDefault()

    const columnStart = formulaColumnKeys.indexOf(columnKey)
    const nextRows = [...rows]

    pastedRows.forEach((pastedRow, pastedRowIndex) => {
      const targetIndex = rowIndex + pastedRowIndex
      const baseRow = nextRows[targetIndex] ?? { ...emptyRow }
      const nextRow = { ...baseRow }

      pastedRow.forEach((cell, cellIndex) => {
        const targetColumn = formulaColumnKeys[columnStart + cellIndex]

        if (!targetColumn) {
          return
        }

        if (targetColumn === 'unit') {
          nextRow.unit = normalizeUnit(cell, baseRow.unit)
          return
        }

        nextRow[targetColumn] = cell.trim()
      })

      nextRows[targetIndex] = nextRow
    })

    onChange(nextRows)
    recordRecentIngredients(
      nextRows
        .slice(rowIndex, rowIndex + pastedRows.length)
        .map((row) => row.ingredientName),
    )
  }

  function applyRecentIngredient(ingredientName: string) {
    const normalized = normalizeIngredientName(ingredientName)

    if (!normalized) {
      return
    }

    const emptyRowIndex = rows.findIndex((row) => row.ingredientName.trim().length === 0)

    if (emptyRowIndex >= 0) {
      onChange(
        rows.map((row, rowIndex) =>
          rowIndex === emptyRowIndex ? { ...row, ingredientName: normalized } : row,
        ),
      )
    } else {
      onChange([...rows, { ...emptyRow, ingredientName: normalized }])
    }

    recordRecentIngredient(normalized)
  }

  return (
    <div className="formula-input">
      <div className="formula-toolbar">
        <div>
          <h3>배합 입력</h3>
          <p>원료별 함량, 비율, 메모를 선택적으로 기록</p>
        </div>
        <div className="formula-actions">
          <button
            type="button"
            className="secondary-button"
            aria-label="음성 입력"
            aria-expanded={isVoicePanelOpen}
            aria-controls="voice-draft-panel"
            onClick={() => setIsVoicePanelOpen((current) => !current)}
          >
            음성 입력
          </button>
          <button type="button" className="primary-button" onClick={addRow}>
            원료 행 추가
          </button>
        </div>
      </div>

      {recentIngredients.length ? (
        <section className="recent-ingredients" aria-label="최근 사용 원료">
          <span>최근 사용 원료</span>
          <div>
            {recentIngredients.map((ingredientName) => (
              <button
                type="button"
                className="recent-ingredient-button"
                key={ingredientName}
                onClick={() => applyRecentIngredient(ingredientName)}
              >
                {ingredientName}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {isVoicePanelOpen ? (
        <section
          id="voice-draft-panel"
          className="voice-draft-panel"
          aria-labelledby="voice-draft-title"
        >
          <div className="voice-draft-heading">
            <div>
              <h3 id="voice-draft-title">음성 입력 초안</h3>
              <p>테아닌 200 밀리그램, 아연 8 밀리그램 추가</p>
            </div>
            <span>설계 모드</span>
          </div>
          <div className="voice-draft-grid">
            <table>
              <thead>
                <tr>
                  <th>원료명</th>
                  <th>함량</th>
                  <th>단위</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {voiceDraftRows.map((draftRow) => (
                  <tr key={draftRow.ingredientName}>
                    <td>{draftRow.ingredientName}</td>
                    <td>{draftRow.amount}</td>
                    <td>{draftRow.unit}</td>
                    <td>{draftRow.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="voice-draft-notice">연구자가 확인한 뒤 배합표에 반영됩니다.</p>
        </section>
      ) : null}

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
                    onBlur={(event) => recordRecentIngredient(event.target.value)}
                    onPaste={(event) => handleSpreadsheetPaste(index, 'ingredientName', event)}
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
                    onPaste={(event) => handleSpreadsheetPaste(index, 'amount', event)}
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
                    onPaste={(event) => handleSpreadsheetPaste(index, 'ratio', event)}
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
                    onPaste={(event) => handleSpreadsheetPaste(index, 'note', event)}
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

function readRecentIngredients() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentIngredientStorageKey) ?? '[]')

    if (!Array.isArray(parsed)) {
      return []
    }

    return compactRecentIngredients(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return []
  }
}

function writeRecentIngredients(ingredients: string[]) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(recentIngredientStorageKey, JSON.stringify(ingredients))
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function mergeRecentIngredients(ingredientName: string, current: string[]) {
  return compactRecentIngredients([ingredientName, ...current])
}

function compactRecentIngredients(ingredients: string[]) {
  const seen = new Set<string>()
  const compacted: string[] = []

  for (const ingredient of ingredients) {
    const normalized = normalizeIngredientName(ingredient)
    const key = normalized.toLocaleLowerCase('ko-KR')

    if (!normalized || seen.has(key)) {
      continue
    }

    seen.add(key)
    compacted.push(normalized)

    if (compacted.length >= maxRecentIngredientCount) {
      break
    }
  }

  return compacted
}

function normalizeIngredientName(ingredientName: string) {
  return ingredientName.trim().replace(/\s+/g, ' ')
}

function isSpreadsheetPaste(clipboardText: string) {
  return clipboardText.includes('\t') || clipboardText.includes('\n')
}

function parseSpreadsheetRows(clipboardText: string) {
  return clipboardText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((row) => row.split('\t'))
    .filter((row) => row.some((cell) => cell.trim().length > 0))
}

function normalizeUnit(unit: string, fallbackUnit: string) {
  const normalized = unit.trim()
  return supportedUnits.has(normalized) ? normalized : fallbackUnit
}
