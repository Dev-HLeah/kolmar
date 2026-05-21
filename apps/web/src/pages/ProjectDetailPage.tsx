import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import { FormulaInputTable, type FormulaRow } from '../components/FormulaInputTable'
import './WorkflowPages.css'

type TryRow = {
  id: number
  apiId?: string
  title: string
  status: TryStatus
  dosageForm: string
  manufacturingProcess: string
  memo: string
  ingredients: FormulaRow[]
  testResults: TryTestResultRow[]
  marked: boolean
}

type TryStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'TESTED'
  | 'CANDIDATE'
  | 'FINAL_CANDIDATE'
  | 'DISCARDED'
  | 'ON_HOLD'

type TryTestResultRow = {
  id: string
  testPurpose: string
  measuredItem: string
  measuredValue: string
  unit: string
  judgment: string
  memo: string
  createdAt?: string
}

type ExperimentGroupRow = {
  id: string
  name: string
  purpose: string
  tries: TryRow[]
}

type ApiFormulaTry = {
  id: string
  tryNumber: number
  status?: TryStatus | null
  title?: string | null
  dosageForm?: string | null
  manufacturingProcess?: string | null
  memo?: string | null
  ingredients?: ApiTryIngredient[]
  testResults?: ApiTestResult[]
  marks?: unknown[]
}

type ApiTryIngredient = {
  amount?: string | number | null
  unit?: string | null
  ratio?: string | number | null
  note?: string | null
  ingredient?: {
    name?: string | null
  } | null
}

type ApiTryMark = {
  id: string
  type: string
}

type ApiTestResult = {
  id: string
  tryId: string
  testPurpose?: string | null
  measuredItem?: string | null
  measuredValue?: string | number | null
  unit?: string | null
  judgment?: string | null
  memo?: string | null
  createdAt?: string | null
}

type ApiExperimentGroup = {
  id: string
  name: string
  purpose?: string | null
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
const emptyFormulaRow: FormulaRow = { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' }
const tryStatusOptions: { value: TryStatus; label: string }[] = [
  { value: 'DRAFT', label: '초안' },
  { value: 'PLANNED', label: '테스트 예정' },
  { value: 'IN_PROGRESS', label: '테스트 중' },
  { value: 'TESTED', label: '테스트 완료' },
  { value: 'CANDIDATE', label: '후보' },
  { value: 'FINAL_CANDIDATE', label: '최종 후보' },
  { value: 'DISCARDED', label: '폐기' },
  { value: 'ON_HOLD', label: '보류' },
]
const tryStatusLabels = tryStatusOptions.reduce<Record<TryStatus, string>>(
  (labels, option) => ({
    ...labels,
    [option.value]: option.label,
  }),
  {} as Record<TryStatus, string>,
)

const initialTries: TryRow[] = [
  {
    id: 1,
    apiId: 'sample-try-1',
    title: '기준 처방',
    status: 'DRAFT',
    dosageForm: '정제',
    manufacturingProcess: '',
    memo: '',
    ingredients: [{ ...emptyFormulaRow, ingredientName: '비타민 C', amount: '500', note: '산미' }],
    testResults: [],
    marked: false,
  },
  {
    id: 2,
    apiId: 'sample-try-2',
    title: '신물 억제 후보',
    status: 'DRAFT',
    dosageForm: '',
    manufacturingProcess: '',
    memo: '',
    ingredients: [{ ...emptyFormulaRow }],
    testResults: [],
    marked: false,
  },
  {
    id: 3,
    apiId: 'sample-try-3',
    title: '맛 개선 후보',
    status: 'DRAFT',
    dosageForm: '',
    manufacturingProcess: '',
    memo: '',
    ingredients: [{ ...emptyFormulaRow }],
    testResults: [],
    marked: false,
  },
  {
    id: 4,
    apiId: 'sample-try-4',
    title: '정제 안정성 후보',
    status: 'DRAFT',
    dosageForm: '',
    manufacturingProcess: '',
    memo: '',
    ingredients: [{ ...emptyFormulaRow }],
    testResults: [],
    marked: false,
  },
  {
    id: 5,
    apiId: 'sample-try-5',
    title: '제조 공정 후보',
    status: 'DRAFT',
    dosageForm: '',
    manufacturingProcess: '',
    memo: '',
    ingredients: [{ ...emptyFormulaRow }],
    testResults: [],
    marked: false,
  },
  {
    id: 6,
    apiId: 'sample-try-6',
    title: '포장 적합성 후보',
    status: 'DRAFT',
    dosageForm: '',
    manufacturingProcess: '',
    memo: '',
    ingredients: [{ ...emptyFormulaRow }],
    testResults: [],
    marked: false,
  },
]

const sampleProjectName = '신물 억제 고형제 개발'
const sampleProjectDescription = '그룹별 try와 테스트 기록을 관리'
const sampleGroupName = '신물 억제 그룹'
const initialGroups: ExperimentGroupRow[] = [
  {
    id: sampleGroupId,
    name: sampleGroupName,
    purpose: '',
    tries: initialTries,
  },
]

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const [projectName, setProjectName] = useState(sampleProjectName)
  const [projectDescription, setProjectDescription] = useState(sampleProjectDescription)
  const [groups, setGroups] = useState<ExperimentGroupRow[]>(initialGroups)
  const [activeGroupId, setActiveGroupId] = useState(sampleGroupId)
  const [tryFilter, setTryFilter] = useState<'all' | 'marked'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TryStatus>('all')
  const [groupTitle, setGroupTitle] = useState('')
  const [groupPurpose, setGroupPurpose] = useState('')
  const [tryTitle, setTryTitle] = useState('')
  const [editTryNumber, setEditTryNumber] = useState('1')
  const [editTitle, setEditTitle] = useState(initialTries[0].title)
  const [editStatus, setEditStatus] = useState<TryStatus>(initialTries[0].status)
  const [editDosageForm, setEditDosageForm] = useState(initialTries[0].dosageForm)
  const [editManufacturingProcess, setEditManufacturingProcess] = useState(
    initialTries[0].manufacturingProcess,
  )
  const [editMemo, setEditMemo] = useState(initialTries[0].memo)
  const [editFormulaRows, setEditFormulaRows] = useState<FormulaRow[]>(initialTries[0].ingredients)
  const [resultTryNumber, setResultTryNumber] = useState('')
  const [testPurpose, setTestPurpose] = useState('')
  const [measuredItem, setMeasuredItem] = useState('')
  const [measuredValue, setMeasuredValue] = useState('')
  const [unit, setUnit] = useState('')
  const [judgment, setJudgment] = useState('')
  const [resultMemo, setResultMemo] = useState('')
  const [notice, setNotice] = useState('')
  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? groups[0],
    [activeGroupId, groups],
  )
  const tries = useMemo(() => activeGroup?.tries ?? [], [activeGroup])
  const markedTryRows = useMemo(
    () =>
      groups.flatMap((group) =>
        group.tries
          .filter((item) => item.marked)
          .map((item) => ({
            groupId: group.id,
            groupName: group.name,
            tryRow: item,
          })),
      ),
    [groups],
  )
  const markedCount = markedTryRows.length
  const visibleTries = useMemo(
    () =>
      tries.filter((item) => {
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter
        const matchesMark = tryFilter === 'all' || item.marked

        return matchesStatus && matchesMark
      }),
    [statusFilter, tries, tryFilter],
  )
  const selectedEditTry = useMemo(
    () => tries.find((item) => String(item.id) === editTryNumber) ?? tries[0],
    [editTryNumber, tries],
  )
  const effectiveResultTryNumber =
    tries.find((item) => String(item.id) === resultTryNumber) ?? tries[0]
  const selectedResultTry = useMemo(
    () => tries.find((item) => item.id === effectiveResultTryNumber?.id),
    [effectiveResultTryNumber, tries],
  )
  const testResultRows = useMemo(
    () =>
      tries.flatMap((formulaTry) =>
        formulaTry.testResults.map((result) => ({
          ...result,
          tryNumber: formulaTry.id,
        })),
      ),
    [tries],
  )
  const maxTryNumber = useMemo(
    () => tries.reduce((highest, item) => Math.max(highest, item.id), 0),
    [tries],
  )
  const trySummary = tries.length > 0 ? `try#1-${maxTryNumber}` : 'try 없음'

  const syncEditForm = useCallback((targetTry?: TryRow) => {
    if (!targetTry) {
      setEditTitle('')
      setEditStatus('DRAFT')
      setEditDosageForm('')
      setEditManufacturingProcess('')
      setEditMemo('')
      setEditFormulaRows([{ ...emptyFormulaRow }])
      return
    }

    setEditTitle(targetTry.title)
    setEditStatus(targetTry.status)
    setEditDosageForm(targetTry.dosageForm)
    setEditManufacturingProcess(targetTry.manufacturingProcess)
    setEditMemo(targetTry.memo)
    setEditFormulaRows(
      targetTry.ingredients.length > 0 ? targetTry.ingredients : [{ ...emptyFormulaRow }],
    )
  }, [])

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

        const loadedGroups = toExperimentGroups(project.groups ?? [])
        const nextActiveGroup = loadedGroups[0] ?? initialGroups[0]

        setProjectName(project.name)
        setProjectDescription(toProjectDescription(project))
        setGroups(loadedGroups.length > 0 ? loadedGroups : initialGroups)
        setActiveGroupId(nextActiveGroup.id)
        setEditTryNumber(nextActiveGroup.tries[0] ? String(nextActiveGroup.tries[0].id) : '')
        setResultTryNumber('')
        setStatusFilter('all')
        syncEditForm(nextActiveGroup.tries[0])
        setNotice('')
      } catch {
        if (!isActive) {
          return
        }

        setProjectName(sampleProjectName)
        setProjectDescription(sampleProjectDescription)
        setGroups(initialGroups)
        setActiveGroupId(sampleGroupId)
        setEditTryNumber(String(initialTries[0].id))
        setResultTryNumber('')
        setStatusFilter('all')
        syncEditForm(initialTries[0])
        setNotice(fallbackNotice)
      }
    }

    void loadProject()

    return () => {
      isActive = false
    }
  }, [projectId, syncEditForm])

  function updateActiveGroupTries(updater: (current: TryRow[]) => TryRow[]) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === activeGroupId ? { ...group, tries: updater(group.tries) } : group,
      ),
    )
  }

  function selectGroup(group: ExperimentGroupRow) {
    setActiveGroupId(group.id)
    setTryFilter('all')
    setStatusFilter('all')
    setEditTryNumber(group.tries[0] ? String(group.tries[0].id) : '')
    setResultTryNumber('')
    syncEditForm(group.tries[0])
  }

  async function createExperimentGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = groupTitle.trim()

    if (!name || !projectId) {
      return
    }

    const payload = {
      name,
      purpose: nullableText(groupPurpose),
    }

    setGroupTitle('')
    setGroupPurpose('')

    try {
      const createdGroup = await apiPost<ApiExperimentGroup, typeof payload>(
        `/projects/${projectId}/groups`,
        payload,
      )
      const newGroup = toExperimentGroup(createdGroup)

      setGroups((currentGroups) => [...currentGroups, newGroup])
      setActiveGroupId(newGroup.id)
      setEditTryNumber('')
      setResultTryNumber('')
      syncEditForm(undefined)
      setNotice('')
    } catch {
      const newGroup: ExperimentGroupRow = {
        id: `local-group-${Date.now()}`,
        name,
        purpose: groupPurpose.trim(),
        tries: [],
      }

      setGroups((currentGroups) => [...currentGroups, newGroup])
      setActiveGroupId(newGroup.id)
      setEditTryNumber('')
      setResultTryNumber('')
      syncEditForm(undefined)
      setNotice(localOnlyNotice)
    }
  }

  async function toggleMarked(id: number) {
    const targetTry = tries.find((item) => item.id === id)

    if (!targetTry) {
      return
    }

    if (targetTry.marked) {
      updateActiveGroupTries((current) =>
        current.map((item) => (item.id === id ? { ...item, marked: false } : item)),
      )
      setNotice(localOnlyNotice)
      return
    }

    if (!targetTry.apiId) {
      updateActiveGroupTries((current) =>
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
      updateActiveGroupTries((current) =>
        current.map((item) => (item.id === id ? { ...item, marked: true } : item)),
      )
      setNotice('')
    } catch {
      updateActiveGroupTries((current) =>
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

      updateActiveGroupTries((current) => [
        ...current,
        {
          id: createdTry.tryNumber,
          apiId: createdTry.id,
          title: createdTry.title?.trim() || title,
          status: createdTry.status ?? 'DRAFT',
          dosageForm: createdTry.dosageForm?.trim() || '',
          manufacturingProcess: createdTry.manufacturingProcess?.trim() || '',
          memo: createdTry.memo?.trim() || '',
          ingredients: toFormulaRows(createdTry.ingredients ?? []),
          testResults: toTestResultRows(createdTry.testResults ?? []),
          marked: false,
        },
      ])
      setNotice('')
    } catch {
      updateActiveGroupTries((current) => [
        ...current,
        {
          id: nextId,
          title,
          status: 'DRAFT',
          dosageForm: '',
          manufacturingProcess: '',
          memo: '',
          ingredients: [{ ...emptyFormulaRow }],
          testResults: [],
          marked: false,
        },
      ])
      setNotice(localOnlyNotice)
    }
  }

  async function deleteTry(id: number) {
    const targetTry = tries.find((item) => item.id === id)
    const remainingTries = tries.filter((item) => item.id !== id)

    updateActiveGroupTries(() => remainingTries)

    if (String(id) === editTryNumber) {
      setEditTryNumber(remainingTries[0] ? String(remainingTries[0].id) : '')
      syncEditForm(remainingTries[0])
    }

    if (String(id) === resultTryNumber) {
      setResultTryNumber('')
    }

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

  async function registerTestResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedResultTry?.apiId) {
      appendTestResult(selectedResultTry?.id, toLocalTestResult())
      setNotice(localOnlyNotice)
      return
    }

    const payload = {
      testPurpose: nullableText(testPurpose),
      measuredItem: nullableText(measuredItem),
      measuredValue: nullableText(measuredValue),
      unit: nullableText(unit),
      judgment: nullableText(judgment),
      memo: nullableText(resultMemo),
    }

    try {
      const createdResult = await apiPost<ApiTestResult, typeof payload>(
        `/projects/tries/${selectedResultTry.apiId}/test-results`,
        payload,
      )

      appendTestResult(selectedResultTry.id, toTestResultRow(createdResult))
      setTestPurpose('')
      setMeasuredItem('')
      setMeasuredValue('')
      setUnit('')
      setJudgment('')
      setResultMemo('')
      setNotice('테스트 결과가 등록됐습니다.')
    } catch {
      appendTestResult(selectedResultTry.id, toLocalTestResult())
      setNotice(localOnlyNotice)
    }
  }

  function appendTestResult(tryNumber: number | undefined, result: TryTestResultRow) {
    if (!tryNumber) {
      return
    }

    updateActiveGroupTries((current) =>
      current.map((item) =>
        item.id === tryNumber ? { ...item, testResults: [result, ...item.testResults] } : item,
      ),
    )
  }

  function toLocalTestResult(): TryTestResultRow {
    return {
      id: `local-${Date.now()}`,
      testPurpose: '',
      measuredItem: measuredItem.trim(),
      measuredValue: measuredValue.trim(),
      unit: unit.trim(),
      judgment: judgment.trim(),
      memo: resultMemo.trim(),
    }
  }

  async function saveTryFormula(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedEditTry) {
      return
    }

    const payload = {
      status: editStatus,
      title: nullableText(editTitle),
      dosageForm: nullableText(editDosageForm),
      manufacturingProcess: nullableText(editManufacturingProcess),
      memo: nullableText(editMemo),
      ingredients: toIngredientPayload(editFormulaRows),
    }

    const localUpdatedTry: TryRow = {
      ...selectedEditTry,
      title: editTitle.trim() || `try#${selectedEditTry.id}`,
      status: editStatus,
      dosageForm: editDosageForm.trim(),
      manufacturingProcess: editManufacturingProcess.trim(),
      memo: editMemo.trim(),
      ingredients: editFormulaRows,
    }

    if (!selectedEditTry.apiId) {
      updateActiveGroupTries((current) =>
        current.map((item) => (item.id === selectedEditTry.id ? localUpdatedTry : item)),
      )
      setNotice(localOnlyNotice)
      return
    }

    try {
      const updatedTry = await apiPatch<ApiFormulaTry, typeof payload>(
        `/projects/tries/${selectedEditTry.apiId}`,
        payload,
      )
      const [updatedRow] = toTryRows([updatedTry])

      updateActiveGroupTries((current) =>
        current.map((item) =>
          item.id === selectedEditTry.id
            ? {
                ...item,
                ...updatedRow,
                marked: item.marked || updatedRow.marked,
              }
            : item,
        ),
      )
      setNotice('Try 배합 정보가 저장됐습니다.')
    } catch {
      updateActiveGroupTries((current) =>
        current.map((item) => (item.id === selectedEditTry.id ? localUpdatedTry : item)),
      )
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
          <h3>{activeGroup?.name ?? sampleGroupName}</h3>
          <span>{trySummary}</span>
        </div>
        <div className="view-toggle" aria-label="실험 그룹 선택">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={group.id === activeGroup?.id ? 'active' : ''}
              aria-label={group.name}
              aria-pressed={group.id === activeGroup?.id}
              onClick={() => selectGroup(group)}
            >
              {group.name} · {group.tries.length}건
            </button>
          ))}
        </div>
        <form className="group-add-form" onSubmit={createExperimentGroup}>
          <label>
            실험 그룹명
            <input value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} />
          </label>
          <label>
            그룹 목적
            <input
              value={groupPurpose}
              onChange={(event) => setGroupPurpose(event.target.value)}
            />
          </label>
          <button type="submit" className="primary-dashboard-button">
            그룹 추가
          </button>
        </form>
        <div className="view-toggle" aria-label="Try 보기 필터">
          <button
            type="button"
            className={tryFilter === 'all' ? 'active' : ''}
            aria-pressed={tryFilter === 'all'}
            onClick={() => setTryFilter('all')}
          >
            전체 Try 보기
          </button>
          <button
            type="button"
            className={tryFilter === 'marked' ? 'active' : ''}
            aria-pressed={tryFilter === 'marked'}
            onClick={() => setTryFilter('marked')}
          >
            의미 있는 Try만 보기
          </button>
        </div>
        <label className="status-filter">
          Try 상태 필터
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | TryStatus)}
          >
            <option value="all">전체 상태</option>
            {tryStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="try-add-form">
          <label>
            Try 목적
            <input value={tryTitle} onChange={(event) => setTryTitle(event.target.value)} />
          </label>
          <button type="button" className="primary-dashboard-button" onClick={addTry}>
            Try 추가
          </button>
        </div>
        <form className="test-result-form" onSubmit={registerTestResult}>
          <label>
            결과 등록 Try
            <select
              value={effectiveResultTryNumber ? String(effectiveResultTryNumber.id) : ''}
              onChange={(event) => setResultTryNumber(event.target.value)}
            >
              {tries.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  try#{item.id} {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            시험 목적
            <input value={testPurpose} onChange={(event) => setTestPurpose(event.target.value)} />
          </label>
          <label>
            측정 항목
            <input value={measuredItem} onChange={(event) => setMeasuredItem(event.target.value)} />
          </label>
          <label>
            측정값
            <input
              inputMode="decimal"
              value={measuredValue}
              onChange={(event) => setMeasuredValue(event.target.value)}
            />
          </label>
          <label>
            단위
            <input value={unit} onChange={(event) => setUnit(event.target.value)} />
          </label>
          <label>
            판정
            <input value={judgment} onChange={(event) => setJudgment(event.target.value)} />
          </label>
          <label className="wide-field">
            메모
            <input value={resultMemo} onChange={(event) => setResultMemo(event.target.value)} />
          </label>
          <button type="submit" className="primary-dashboard-button">
            테스트 결과 등록
          </button>
        </form>
        {notice ? <p className="local-notice">{notice}</p> : null}
        <section className="project-marked-tries">
          <div className="panel-heading compact">
            <h3>프로젝트 의미 Try</h3>
            <span>{markedTryRows.length}건</span>
          </div>
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>그룹</th>
                  <th>Try</th>
                  <th>목적</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {markedTryRows.map(({ groupId, groupName, tryRow }) => (
                  <tr key={`${groupId}-${tryRow.id}`}>
                    <td>{groupName}</td>
                    <td>try#{tryRow.id}</td>
                    <td>{tryRow.title}</td>
                    <td>{tryStatusLabels[tryRow.status]}</td>
                  </tr>
                ))}
                {markedTryRows.length === 0 ? (
                  <tr>
                    <td colSpan={4}>프로젝트에 마킹된 Try 없음</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        <section className="test-result-history">
          <div className="panel-heading compact">
            <h3>테스트 결과 이력</h3>
            <span>{testResultRows.length}건</span>
          </div>
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>Try</th>
                  <th>시험 목적</th>
                  <th>측정 항목</th>
                  <th>측정값</th>
                  <th>판정</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {testResultRows.map((result) => (
                  <tr key={result.id}>
                    <td>try#{result.tryNumber}</td>
                    <td>{result.testPurpose || '-'}</td>
                    <td>{result.measuredItem || '-'}</td>
                    <td>{formatMeasurement(result)}</td>
                    <td>{result.judgment || '-'}</td>
                    <td>{result.memo || '-'}</td>
                  </tr>
                ))}
                {testResultRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>등록된 테스트 결과 없음</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        <form className="try-detail-form" onSubmit={saveTryFormula}>
          <div className="panel-heading compact">
            <h3>Try 배합 정보</h3>
            <span>선택 입력</span>
          </div>
          <div className="try-detail-grid">
            <label>
              편집 Try
              <select
                value={selectedEditTry ? String(selectedEditTry.id) : ''}
                onChange={(event) => {
                  const nextTryNumber = event.target.value
                  setEditTryNumber(nextTryNumber)
                  syncEditForm(tries.find((item) => String(item.id) === nextTryNumber))
                }}
              >
                {tries.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    try#{item.id} {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Try 제목
              <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </label>
            <label>
              Try 상태
              <select
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value as TryStatus)}
              >
                {tryStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              제형
              <input
                value={editDosageForm}
                onChange={(event) => setEditDosageForm(event.target.value)}
              />
            </label>
            <label>
              제조 공정
              <input
                value={editManufacturingProcess}
                onChange={(event) => setEditManufacturingProcess(event.target.value)}
              />
            </label>
            <label className="wide-field">
              Try 메모
              <input value={editMemo} onChange={(event) => setEditMemo(event.target.value)} />
            </label>
          </div>
          <FormulaInputTable rows={editFormulaRows} onChange={setEditFormulaRows} />
          <div className="form-actions">
            <span>원료명만 입력된 행도 저장됩니다.</span>
            <button type="submit" className="primary-dashboard-button">
              Try 배합 저장
            </button>
          </div>
        </form>
        <div className="workflow-table-wrap">
          <table className="workflow-table">
            <thead>
              <tr>
                <th>Try</th>
                <th>목적</th>
                <th>상태</th>
                <th>마킹</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {visibleTries.map((item) => (
                <tr key={item.id}>
                  <td>try#{item.id}</td>
                  <td>{item.title}</td>
                  <td>{tryStatusLabels[item.status]}</td>
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
              {visibleTries.length === 0 ? (
                <tr>
                  <td colSpan={5}>마킹된 Try 없음</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function nullableText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function toProjectDescription(project: ApiProject) {
  const summary = [project.function, project.desiredForm, project.goal]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' · ')

  return summary || sampleProjectDescription
}

function toExperimentGroups(groups: ApiExperimentGroup[]): ExperimentGroupRow[] {
  return groups.map(toExperimentGroup)
}

function toExperimentGroup(group: ApiExperimentGroup): ExperimentGroupRow {
  return {
    id: group.id,
    name: group.name.trim() || '기본 그룹',
    purpose: group.purpose?.trim() ?? '',
    tries: toTryRows(group.tries ?? []),
  }
}

function toTryRows(tries: ApiFormulaTry[]): TryRow[] {
  return [...tries]
    .sort((left, right) => left.tryNumber - right.tryNumber)
    .map((item) => ({
      id: item.tryNumber,
      apiId: item.id,
      title: item.title?.trim() || `try#${item.tryNumber}`,
      status: item.status ?? 'DRAFT',
      dosageForm: item.dosageForm?.trim() || '',
      manufacturingProcess: item.manufacturingProcess?.trim() || '',
      memo: item.memo?.trim() || '',
      ingredients: toFormulaRows(item.ingredients ?? []),
      testResults: toTestResultRows(item.testResults ?? []),
      marked: (item.marks?.length ?? 0) > 0,
    }))
}

function toFormulaRows(ingredients: ApiTryIngredient[]): FormulaRow[] {
  const rows = ingredients
    .filter((ingredient) => ingredient.ingredient?.name?.trim())
    .map((ingredient) => ({
      ingredientName: ingredient.ingredient?.name?.trim() ?? '',
      amount: toFieldValue(ingredient.amount),
      unit: ingredient.unit?.trim() || 'mg',
      ratio: toFieldValue(ingredient.ratio),
      note: ingredient.note?.trim() ?? '',
    }))

  return rows.length > 0 ? rows : [{ ...emptyFormulaRow }]
}

function toFieldValue(value?: string | number | null) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function toIngredientPayload(rows: FormulaRow[]) {
  return rows
    .map((row) => ({
      ingredientName: row.ingredientName.trim(),
      amount: nullableText(row.amount),
      unit: nullableText(row.unit),
      ratio: nullableText(row.ratio),
      note: nullableText(row.note),
    }))
    .filter((row) => row.ingredientName)
}

function toTestResultRows(results: ApiTestResult[]): TryTestResultRow[] {
  return results.map(toTestResultRow)
}

function toTestResultRow(result: ApiTestResult): TryTestResultRow {
  return {
    id: result.id,
    testPurpose: result.testPurpose?.trim() ?? '',
    measuredItem: result.measuredItem?.trim() ?? '',
    measuredValue: toFieldValue(result.measuredValue),
    unit: result.unit?.trim() ?? '',
    judgment: result.judgment?.trim() ?? '',
    memo: result.memo?.trim() ?? '',
    createdAt: result.createdAt ?? undefined,
  }
}

function formatMeasurement(result: TryTestResultRow) {
  const value = result.measuredValue.trim()
  const measurementUnit = result.unit.trim()

  if (!value && !measurementUnit) {
    return '-'
  }

  return [value, measurementUnit].filter(Boolean).join(' ')
}
