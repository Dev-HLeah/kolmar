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
  readOnly?: boolean
}

type IngredientSuggestion = {
  name: string
  keywords: string[]
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
const convertibleUnits = new Set(['mg', 'g'])
const unitAliases = new Map([
  ['mg', 'mg'],
  ['milligram', 'mg'],
  ['milligrams', 'mg'],
  ['밀리그램', 'mg'],
  ['미리그램', 'mg'],
  ['g', 'g'],
  ['gram', 'g'],
  ['grams', 'g'],
  ['그램', 'g'],
  ['%', '%'],
  ['percent', '%'],
  ['percentage', '%'],
  ['퍼센트', '%'],
  ['프로', '%'],
  ['ppm', 'ppm'],
  ['피피엠', 'ppm'],
] satisfies Array<[string, string]>)
const baseIngredientSuggestions: IngredientSuggestion[] = [
  { name: '비타민 C', keywords: ['비타', 'vitamin c', 'ascorbic', '아스코르브산'] },
  { name: '아연', keywords: ['zinc', 'zn'] },
  { name: '테아닌', keywords: ['theanine', 'l-theanine'] },
  { name: '마그네슘', keywords: ['magnesium', 'mg'] },
  { name: '프로바이오틱스', keywords: ['probiotic', '유산균'] },
  { name: '오메가3', keywords: ['omega 3', 'dha', 'epa'] },
]

type FormulaColumnKey = (typeof formulaColumnKeys)[number]

export function FormulaInputTable({ rows, onChange, readOnly = false }: Props) {
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false)
  const [recentIngredients, setRecentIngredients] = useState(readRecentIngredients)
  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null)
  const formulaSummary = getFormulaSummary(rows)

  function updateRow(index: number, key: keyof FormulaRow, value: string) {
    const newRows = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    if (key === 'amount' || key === 'unit') {
      onChange(autoRecalculateRatios(newRows))
    } else {
      onChange(newRows)
    }
  }

  function convertUnit(index: number, targetUnit: 'mg' | 'g') {
    const row = rows[index]

    if (!row) {
      return
    }

    const amount = Number(row.amount)

    if (
      row.amount.trim().length === 0 ||
      !Number.isFinite(amount) ||
      !convertibleUnits.has(row.unit)
    ) {
      return
    }

    if (row.unit === targetUnit) {
      return
    }

    const convertedAmount = targetUnit === 'mg' ? amount * 1000 : amount / 1000
    onChange(
      rows.map((currentRow, rowIndex) =>
        rowIndex === index
          ? { ...currentRow, amount: formatAmount(convertedAmount), unit: targetUnit }
          : currentRow,
      ),
    )
  }

  function addRow() {
    onChange([...rows, { ...emptyRow }])
  }

  function removeRow(index: number) {
    if (rows.length === 1) {
      onChange([{ ...emptyRow }])
      return
    }

    onChange(autoRecalculateRatios(rows.filter((_, rowIndex) => rowIndex !== index)))
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
          if (!cell.trim()) {
            return
          }

          nextRow.unit = normalizeUnit(cell, baseRow.unit)
          return
        }

        if (targetColumn === 'amount') {
          const parsedAmount = parseAmountWithOptionalUnit(cell)
          nextRow.amount = parsedAmount.amount

          if (parsedAmount.unit) {
            nextRow.unit = parsedAmount.unit
          }

          return
        }

        nextRow[targetColumn] = cell.trim()
      })

      nextRows[targetIndex] = nextRow
    })

    onChange(autoRecalculateRatios(nextRows))
    recordRecentIngredients(
      nextRows
        .slice(rowIndex, rowIndex + pastedRows.length)
        .map((row) => row.ingredientName),
    )
  }

  function handleAmountPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const clipboardText = event.clipboardData.getData('text/plain')

    if (isSpreadsheetPaste(clipboardText)) {
      handleSpreadsheetPaste(index, 'amount', event)
      return
    }

    const parsedAmount = parseAmountWithOptionalUnit(clipboardText)

    if (!parsedAmount.unit) {
      return
    }

    event.preventDefault()
    onChange(
      autoRecalculateRatios(
        rows.map((row, rowIndex) =>
          rowIndex === index
            ? { ...row, amount: parsedAmount.amount, unit: parsedAmount.unit }
            : row,
        ),
      ),
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

  function applyIngredientSuggestion(index: number, ingredientName: string) {
    const normalized = normalizeIngredientName(ingredientName)

    if (!normalized) {
      return
    }

    updateRow(index, 'ingredientName', normalized)
    recordRecentIngredient(normalized)
    setActiveSuggestionRow(null)
  }

  function calculateRatiosFromAmounts() {
    const ratioBasis = getRatioCalculationBasis(rows)

    if (!ratioBasis) {
      return
    }

    onChange(
      rows.map((row) => {
        const amount = parseFormulaNumber(row.amount)

        if (amount === null || normalizeUnit(row.unit, 'mg') !== ratioBasis.unit) {
          return row
        }

        return {
          ...row,
          ratio: formatRatio((amount / ratioBasis.totalAmount) * 100),
        }
      }),
    )
  }

  function normalizeAmountsToUnit(targetUnit: 'mg' | 'g') {
    if (!canNormalizeAmountsToUnit(rows, targetUnit)) {
      return
    }

    onChange(
      rows.map((row) => {
        const amount = parseFormulaNumber(row.amount)

        if (amount === null || !convertibleUnits.has(row.unit)) {
          return row
        }

        return {
          ...row,
          amount: formatAmount(convertAmount(amount, row.unit, targetUnit)),
          unit: targetUnit,
        }
      }),
    )
  }

  return (
    <div className="formula-input">
      <div className="formula-toolbar">
        <div>
          <h3>배합 입력</h3>
          <p>원료별 함량, 비율, 메모를 선택적으로 기록</p>
        </div>
        {!readOnly && (
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
          </div>
        )}
      </div>

      {!readOnly && recentIngredients.length ? (
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
            {rows.map((row, index) => {
              const ingredientSuggestions = getIngredientSuggestions(
                row.ingredientName,
                recentIngredients,
              )
              const shouldShowSuggestions =
                activeSuggestionRow === index && ingredientSuggestions.length > 0

              return (
                <tr key={index}>
                  <td>
                    <div className="ingredient-input-cell">
                      <label className="sr-only" htmlFor={`ingredient-${index}`}>
                        원료명 {index + 1}
                      </label>
                      <input
                        id={`ingredient-${index}`}
                        value={row.ingredientName}
                        readOnly={readOnly}
                        onFocus={() => !readOnly && setActiveSuggestionRow(index)}
                        onChange={(event) => {
                          if (readOnly) return
                          updateRow(index, 'ingredientName', event.target.value)
                          setActiveSuggestionRow(index)
                        }}
                        onBlur={(event) => {
                          if (readOnly) return
                          recordRecentIngredient(event.target.value)
                          setActiveSuggestionRow((current) =>
                            current === index ? null : current,
                          )
                        }}
                        onPaste={(event) =>
                          !readOnly && handleSpreadsheetPaste(index, 'ingredientName', event)
                        }
                        placeholder="예: 비타민 C"
                      />
                      {shouldShowSuggestions ? (
                        <section
                          className="ingredient-suggestions"
                          aria-label={`원료 자동완성 ${index + 1}`}
                        >
                          {ingredientSuggestions.map((ingredientName) => (
                            <button
                              type="button"
                              key={ingredientName}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyIngredientSuggestion(index, ingredientName)}
                            >
                              {ingredientName}
                            </button>
                          ))}
                        </section>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`amount-${index}`}>
                      함량 {index + 1}
                    </label>
                    <input
                      id={`amount-${index}`}
                      inputMode="decimal"
                      value={row.amount}
                      readOnly={readOnly}
                      onChange={(event) => !readOnly && updateRow(index, 'amount', event.target.value)}
                      onPaste={(event) => !readOnly && handleAmountPaste(index, event)}
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`unit-${index}`}>
                      단위 {index + 1}
                    </label>
                    <div className="unit-control">
                      <select
                        id={`unit-${index}`}
                        value={row.unit}
                        disabled={readOnly}
                        onChange={(event) => updateRow(index, 'unit', event.target.value)}
                      >
                        <option value="mg">mg</option>
                        <option value="g">g</option>
                        <option value="%">%</option>
                        <option value="ppm">ppm</option>
                      </select>
                      {!readOnly && (
                        <div className="unit-conversion-actions">
                          <button
                            type="button"
                            aria-label={`${index + 1}행 mg로 변환`}
                            disabled={!canConvertUnit(row, 'mg')}
                            onClick={() => convertUnit(index, 'mg')}
                          >
                            mg
                          </button>
                          <button
                            type="button"
                            aria-label={`${index + 1}행 g로 변환`}
                            disabled={!canConvertUnit(row, 'g')}
                            onClick={() => convertUnit(index, 'g')}
                          >
                            g
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`ratio-${index}`}>
                      비율 {index + 1}
                    </label>
                    <input
                      id={`ratio-${index}`}
                      inputMode="decimal"
                      value={row.ratio}
                      readOnly={readOnly}
                      onChange={(event) => !readOnly && updateRow(index, 'ratio', event.target.value)}
                      onPaste={(event) => !readOnly && handleSpreadsheetPaste(index, 'ratio', event)}
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
                      readOnly={readOnly}
                      onChange={(event) => !readOnly && updateRow(index, 'note', event.target.value)}
                      onPaste={(event) => !readOnly && handleSpreadsheetPaste(index, 'note', event)}
                      placeholder="역할, 맛, 색, 이슈"
                    />
                  </td>
                  {!readOnly && (
                    <td>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => removeRow(index)}
                      >
                        삭제
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button type="button" className="formula-add-row-btn" onClick={addRow}>
          + 원료 행 추가
        </button>
      )}

      <section
        className={`formula-summary${formulaSummary.isRatioOverLimit ? ' is-warning' : ''}`}
        aria-label="배합 합계"
      >
        <span>입력 원료 {formulaSummary.rowCount}개</span>
        <span>함량 합계 {formulaSummary.amountLabel}</span>
        <span>비율 합계 {formulaSummary.ratioLabel}</span>
        <button
          type="button"
          className="summary-action-button"
          disabled={!formulaSummary.canNormalizeToMilligrams}
          onClick={() => normalizeAmountsToUnit('mg')}
        >
          mg로 전체 통일
        </button>
        <button
          type="button"
          className="summary-action-button"
          disabled={!formulaSummary.canNormalizeToGrams}
          onClick={() => normalizeAmountsToUnit('g')}
        >
          g로 전체 통일
        </button>
        <button
          type="button"
          className="summary-action-button"
          disabled={!formulaSummary.canCalculateRatio}
          onClick={calculateRatiosFromAmounts}
        >
          함량 기준 비율 계산
        </button>
        {formulaSummary.ratioCalculationHint ? (
          <span className="summary-hint">{formulaSummary.ratioCalculationHint}</span>
        ) : null}
        {formulaSummary.isRatioOverLimit ? (
          <strong>비율 합계가 100%를 초과했습니다.</strong>
        ) : null}
      </section>
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

function getFormulaSummary(rows: FormulaRow[]) {
  const amountTotals = new Map<string, number>()
  let totalRatio = 0
  const ratioBasis = getRatioCalculationBasis(rows)

  rows.forEach((row) => {
    const amount = parseFormulaNumber(row.amount)

    if (amount !== null) {
      const unit = normalizeUnit(row.unit, 'mg')
      amountTotals.set(unit, (amountTotals.get(unit) ?? 0) + amount)
    }

    const ratio = parseFormulaNumber(row.ratio)

    if (ratio !== null) {
      totalRatio += ratio
    }
  })

  return {
    rowCount: rows.filter(hasFormulaValue).length,
    amountLabel: formatAmountTotals(amountTotals),
    ratioLabel: `${formatSummaryNumber(totalRatio)}%`,
    isRatioOverLimit: totalRatio > 100,
    canCalculateRatio: ratioBasis !== null,
    canNormalizeToMilligrams: canNormalizeAmountsToUnit(rows, 'mg'),
    canNormalizeToGrams: canNormalizeAmountsToUnit(rows, 'g'),
    ratioCalculationHint: ratioBasis ? null : getRatioCalculationHint(rows),
  }
}

function hasFormulaValue(row: FormulaRow) {
  return [row.ingredientName, row.amount, row.ratio, row.note].some(
    (value) => value.trim().length > 0,
  )
}

function parseFormulaNumber(value: string) {
  const normalized = value.trim().replace(/,/g, '')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function getRatioCalculationBasis(rows: FormulaRow[]) {
  const amountRows = getAmountRows(rows)

  if (!amountRows.length) {
    return null
  }

  const units = new Set(amountRows.map((row) => row.unit))
  const totalAmount = amountRows.reduce((total, row) => total + row.amount, 0)

  if (units.size !== 1 || totalAmount <= 0) {
    return null
  }

  return {
    totalAmount,
    unit: amountRows[0].unit,
  }
}

function getRatioCalculationHint(rows: FormulaRow[]) {
  const amountRows = getAmountRows(rows)

  if (!amountRows.length) {
    return '함량을 입력하면 비율을 계산할 수 있습니다.'
  }

  if (new Set(amountRows.map((row) => row.unit)).size > 1) {
    return '단위가 섞여 있어 비율 계산 전 단위 통일이 필요합니다.'
  }

  return null
}

function canNormalizeAmountsToUnit(rows: FormulaRow[], targetUnit: 'mg' | 'g') {
  const amountRows = getAmountRows(rows)

  if (!amountRows.length) {
    return false
  }

  return (
    amountRows.every((row) => convertibleUnits.has(row.unit)) &&
    amountRows.some((row) => row.unit !== targetUnit)
  )
}

function convertAmount(amount: number, sourceUnit: string, targetUnit: 'mg' | 'g') {
  if (sourceUnit === targetUnit) {
    return amount
  }

  return targetUnit === 'mg' ? amount * 1000 : amount / 1000
}

function getAmountRows(rows: FormulaRow[]) {
  return rows
    .map((row) => ({
      amount: parseFormulaNumber(row.amount),
      unit: normalizeUnit(row.unit, 'mg'),
    }))
    .filter((row): row is { amount: number; unit: string } => row.amount !== null)
}

function formatAmountTotals(amountTotals: Map<string, number>) {
  if (!amountTotals.size) {
    return '0'
  }

  return [...amountTotals.entries()]
    .map(([unit, amount]) => `${formatSummaryNumber(amount)} ${unit}`)
    .join(' + ')
}

function formatSummaryNumber(value: number) {
  return Number(value.toFixed(6)).toLocaleString('ko-KR', {
    maximumFractionDigits: 6,
  })
}

function formatRatio(value: number) {
  return Number(value.toFixed(6)).toString()
}

function getIngredientSuggestions(query: string, recentIngredients: string[]) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  return compactIngredientNames([
    ...recentIngredients,
    ...baseIngredientSuggestions.map((suggestion) => suggestion.name),
  ])
    .filter((ingredientName) => matchesIngredientSuggestion(ingredientName, normalizedQuery))
    .slice(0, 5)
}

function matchesIngredientSuggestion(ingredientName: string, normalizedQuery: string) {
  const baseSuggestion = baseIngredientSuggestions.find(
    (suggestion) => normalizeSearchText(suggestion.name) === normalizeSearchText(ingredientName),
  )
  const searchableValues = [ingredientName, ...(baseSuggestion?.keywords ?? [])]

  return searchableValues
    .map(normalizeSearchText)
    .some((searchableValue) => searchableValue.includes(normalizedQuery))
}

function compactIngredientNames(ingredients: string[]) {
  const seen = new Set<string>()
  const compacted: string[] = []

  for (const ingredient of ingredients) {
    const normalized = normalizeIngredientName(ingredient)
    const key = normalizeSearchText(normalized)

    if (!normalized || seen.has(key)) {
      continue
    }

    seen.add(key)
    compacted.push(normalized)
  }

  return compacted
}

function normalizeIngredientName(ingredientName: string) {
  return ingredientName.trim().replace(/\s+/g, ' ')
}

function normalizeSearchText(value: string) {
  return normalizeIngredientName(value).toLocaleLowerCase('ko-KR')
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

function parseAmountWithOptionalUnit(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^([+-]?(?:(?:\d[\d,]*)(?:\.\d+)?|\.\d+))\s*(.+)$/)

  if (!match) {
    return {
      amount: trimmed,
      unit: null,
    }
  }

  const unit = normalizeUnit(match[2], '')

  if (!unit) {
    return {
      amount: trimmed,
      unit: null,
    }
  }

  return {
    amount: match[1].replace(/,/g, ''),
    unit,
  }
}

function normalizeUnit(unit: string, fallbackUnit: string) {
  const normalized = unit.trim()
  const alias = unitAliases.get(normalizeUnitKey(normalized))

  if (alias && supportedUnits.has(alias)) {
    return alias
  }

  return supportedUnits.has(normalized) ? normalized : fallbackUnit
}

function normalizeUnitKey(unit: string) {
  return unit.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')
}

function autoRecalculateRatios(rows: FormulaRow[]): FormulaRow[] {
  const ratioBasis = getRatioCalculationBasis(rows)
  if (!ratioBasis) return rows

  return rows.map((row) => {
    const amount = parseFormulaNumber(row.amount)
    if (amount === null || normalizeUnit(row.unit, 'mg') !== ratioBasis.unit) return row
    return { ...row, ratio: formatRatio((amount / ratioBasis.totalAmount) * 100) }
  })
}

function canConvertUnit(row: FormulaRow, targetUnit: 'mg' | 'g') {
  return (
    row.unit !== targetUnit &&
    convertibleUnits.has(row.unit) &&
    row.amount.trim().length > 0 &&
    Number.isFinite(Number(row.amount))
  )
}

function formatAmount(amount: number) {
  return Number(amount.toFixed(6)).toString()
}
