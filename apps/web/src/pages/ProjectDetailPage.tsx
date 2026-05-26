import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import { CustomSelect } from '../components/CustomSelect'
import { FormulaInputTable, type FormulaRow } from '../components/FormulaInputTable'
import './WorkflowPages.css'

type TryRow = {
  id: string
  tryNumber: number
  title: string
  dosageForm: string
  memo: string
  starred: boolean
  ingredients: FormulaRow[]
  registeredProductId: string | null
}

type ProjectMeta = {
  name: string
  background: string
  objective: string
  sourceProductId: string | null
  sourceProductName: string | null
}

type ApiFormulaTry = {
  id: string
  tryNumber: number
  title?: string | null
  dosageForm?: string | null
  memo?: string | null
  starred?: boolean
  ingredients?: ApiTryIngredient[]
  sourceProducts?: Array<{ id: string }>
}

type ApiTryIngredient = {
  amount?: string | number | null
  unit?: string | null
  ratio?: string | number | null
  note?: string | null
  ingredient?: { name?: string | null } | null
}

type ApiProject = {
  id: string
  name: string
  background?: string | null
  objective?: string | null
  sourceProductId?: string | null
  tries?: ApiFormulaTry[]
}

type ApiProduct = {
  id: string
  name: string
}

type ApiProductWithFormulas = ApiProduct & {
  formulas?: Array<{
    ingredients: Array<{
      amount?: string | number | null
      unit?: string | null
      ratio?: string | number | null
      ingredient?: { name?: string | null } | null
    }>
  }>
}

type DosageFormOption = {
  id: string
  name: string
}

const emptyFormulaRow: FormulaRow = { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' }

const localOnlyNotice = 'API 연결 실패로 로컬 화면에만 반영됐습니다.'

type TryDraft = {
  title: string
  dosageForm: string
  memo: string
  ingredients: FormulaRow[]
}

function toTryDraft(tryRow: TryRow): TryDraft {
  return {
    title: tryRow.title,
    dosageForm: tryRow.dosageForm,
    memo: tryRow.memo,
    ingredients: tryRow.ingredients.length > 0 ? tryRow.ingredients : [{ ...emptyFormulaRow }],
  }
}

function isTryDraftDirty(draft: TryDraft, source: TryRow): boolean {
  if (draft.title !== source.title) return true
  if (draft.dosageForm !== source.dosageForm) return true
  if (draft.memo !== source.memo) return true
  if (draft.ingredients.length !== source.ingredients.length) return true
  return draft.ingredients.some((row, i) => {
    const orig = source.ingredients[i]
    if (!orig) return true
    return row.ingredientName !== orig.ingredientName ||
      row.amount !== orig.amount ||
      row.unit !== orig.unit ||
      row.ratio !== orig.ratio ||
      row.note !== orig.note
  })
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [projectMeta, setProjectMeta] = useState<ProjectMeta>({
    name: '프로젝트 로딩 중...',
    background: '',
    objective: '',
    sourceProductId: null,
    sourceProductName: null,
  })
  const [tries, setTries] = useState<TryRow[]>([])
  const [selectedTryId, setSelectedTryId] = useState<string | null>(null)
  const [tryDraft, setTryDraft] = useState<TryDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const [metaDraft, setMetaDraft] = useState({ background: '', objective: '' })
  const [savedMeta, setSavedMeta] = useState({ background: '', objective: '' })
  const [isSavingMeta, setIsSavingMeta] = useState(false)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)

  const [productName, setProductName] = useState('')
  const [isRegisteringProduct, setIsRegisteringProduct] = useState(false)
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false)

  const [dosageFormOptions, setDosageFormOptions] = useState<DosageFormOption[]>([])
  const [sourceRows, setSourceRows] = useState<FormulaRow[] | null>(null)
  const [isLoadingSourceRows, setIsLoadingSourceRows] = useState(false)

  const selectedTry = useMemo(
    () => tries.find((t) => t.id === selectedTryId) ?? null,
    [tries, selectedTryId],
  )

  const isLocked = selectedTry?.registeredProductId != null

  const isDirty = useMemo(
    () => !isLocked && tryDraft !== null && selectedTry !== null && isTryDraftDirty(tryDraft, selectedTry),
    [isLocked, tryDraft, selectedTry],
  )

  const isMetaDirty =
    metaDraft.background !== savedMeta.background ||
    metaDraft.objective !== savedMeta.objective

  const blocker = useBlocker(isDirty)
  const starredCount = tries.filter((t) => t.starred).length

  useEffect(() => {
    let isActive = true

    async function loadDosageForms() {
      try {
        const forms = await apiGet<DosageFormOption[]>('/dosage-forms')
        if (isActive) setDosageFormOptions(forms)
      } catch { /* use empty list */ }
    }

    void loadDosageForms()
    return () => { isActive = false }
  }, [])

  useEffect(() => {
    if (!projectId) return
    let isActive = true

    async function loadProject() {
      try {
        const project = await apiGet<ApiProject>(`/projects/${projectId}`)
        if (!isActive) return

        const loadedTries = (project.tries ?? [])
          .map(toTryRow)
          .sort((a, b) => a.tryNumber - b.tryNumber)

        let sourceProductName: string | null = null
        if (project.sourceProductId) {
          try {
            const p = await apiGet<ApiProduct>(`/products/${project.sourceProductId}`)
            sourceProductName = p.name
          } catch { /* no-op */ }
        }

        setProjectMeta({
          name: project.name,
          background: project.background ?? '',
          objective: project.objective ?? '',
          sourceProductId: project.sourceProductId ?? null,
          sourceProductName,
        })
        const meta = { background: project.background ?? '', objective: project.objective ?? '' }
        setMetaDraft(meta)
        setSavedMeta(meta)
        setTries(loadedTries)

        if (loadedTries.length > 0) {
          setSelectedTryId(loadedTries[0].id)
          setTryDraft(toTryDraft(loadedTries[0]))
        }
      } catch {
        if (!isActive) return
        setProjectMeta((prev) => ({ ...prev, name: '프로젝트 로드 실패' }))
      }
    }

    void loadProject()
    return () => { isActive = false }
  }, [projectId])

  const selectTry = useCallback(
    (tryRow: TryRow) => {
      setSelectedTryId(tryRow.id)
      setTryDraft(toTryDraft(tryRow))
      setNotice('')
      setProductName('')
    },
    [],
  )

  async function saveTryDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTry || !tryDraft || isLocked) return

    setIsSaving(true)

    try {
      const updated = await apiPatch<ApiFormulaTry, object>(
        `/projects/tries/${selectedTry.id}`,
        {
          title: tryDraft.title.trim() || null,
          dosageForm: tryDraft.dosageForm.trim() || null,
          memo: tryDraft.memo.trim() || null,
          ingredients: tryDraft.ingredients,
        },
      )
      const updatedRow = toTryRow(updated)
      setTries((current) => current.map((t) => (t.id === selectedTry.id ? updatedRow : t)))
      setTryDraft(toTryDraft(updatedRow))
      setNotice('저장됐습니다.')
    } catch {
      const localRow: TryRow = {
        ...selectedTry,
        title: tryDraft.title.trim() || `Try#${selectedTry.tryNumber}`,
        dosageForm: tryDraft.dosageForm.trim(),
        memo: tryDraft.memo.trim(),
        ingredients: tryDraft.ingredients,
      }
      setTries((current) => current.map((t) => (t.id === selectedTry.id ? localRow : t)))
      setTryDraft(toTryDraft(localRow))
      setNotice(localOnlyNotice)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStar(tryId: string) {
    const target = tries.find((t) => t.id === tryId)
    if (!target) return

    setTries((current) =>
      current.map((t) => (t.id === tryId ? { ...t, starred: !t.starred } : t)),
    )

    try {
      await apiPatch(`/projects/tries/${tryId}/star`, {})
    } catch {
      setTries((current) =>
        current.map((t) => (t.id === tryId ? { ...t, starred: target.starred } : t)),
      )
    }
  }

  async function handleAddTry() {
    const maxNumber = tries.reduce((m, t) => Math.max(m, t.tryNumber), 0)
    const nextNumber = maxNumber + 1
    const title = `Try#${nextNumber}`

    try {
      const created = await apiPost<ApiFormulaTry, object>(
        `/projects/${projectId}/tries`,
        { tryNumber: nextNumber, title },
      )
      const newTry = toTryRow(created)
      setTries((current) => [...current, newTry])
      setSelectedTryId(newTry.id)
      setTryDraft(toTryDraft(newTry))
      setNotice('')
    } catch {
      const localTry: TryRow = {
        id: `local-${Date.now()}`,
        tryNumber: nextNumber,
        title,
        dosageForm: '',
        memo: '',
        starred: false,
        ingredients: [],
        registeredProductId: null,
      }
      setTries((current) => [...current, localTry])
      setSelectedTryId(localTry.id)
      setTryDraft(toTryDraft(localTry))
      setNotice(localOnlyNotice)
    }
  }

  async function deleteTry(tryId: string) {
    const remaining = tries.filter((t) => t.id !== tryId)
    setTries(remaining)

    if (selectedTryId === tryId) {
      const next = remaining[remaining.length - 1] ?? null
      setSelectedTryId(next?.id ?? null)
      setTryDraft(next ? toTryDraft(next) : null)
    }

    try {
      await apiDelete(`/projects/tries/${tryId}`)
      setNotice('')
    } catch {
      setNotice(localOnlyNotice)
    }
  }

  async function saveProjectMeta() {
    if (!projectId) return
    setIsSavingMeta(true)
    try {
      await apiPatch(`/projects/${projectId}/metadata`, {
        background: metaDraft.background.trim() || null,
        objective: metaDraft.objective.trim() || null,
      })
      setSavedMeta({ ...metaDraft })
      setProjectMeta((prev) => ({
        ...prev,
        background: metaDraft.background,
        objective: metaDraft.objective,
      }))
      setNotice('프로젝트 정보가 저장됐습니다.')
    } catch {
      setNotice(localOnlyNotice)
    } finally {
      setIsSavingMeta(false)
    }
  }

  async function doRegisterProduct() {
    if (!selectedTry || !productName.trim()) return

    setIsRegisteringProduct(true)
    try {
      const created = await apiPost<ApiProduct, object>(
        `/projects/tries/${selectedTry.id}/product`,
        { name: productName.trim() },
      )
      setTries((current) =>
        current.map((t) =>
          t.id === selectedTry.id ? { ...t, registeredProductId: created.id } : t,
        ),
      )
      setProductName('')
      setNotice(
        <span>
          제품으로 등록됐습니다:{' '}
          <Link to={`/products/${created.id}`}>{created.name}</Link>
        </span> as unknown as string,
      )
    } catch {
      setNotice(localOnlyNotice)
    } finally {
      setIsRegisteringProduct(false)
    }
  }

  async function handleApplySourceRows() {
    if (!projectMeta.sourceProductId || !tryDraft) return

    let rows = sourceRows
    if (!rows) {
      setIsLoadingSourceRows(true)
      try {
        const product = await apiGet<ApiProductWithFormulas>(`/products/${projectMeta.sourceProductId}`)
        rows = productFormulaToRows(product)
        setSourceRows(rows)
      } catch {
        setNotice('기준 제품 원료를 불러오지 못했습니다.')
        return
      } finally {
        setIsLoadingSourceRows(false)
      }
    }

    if (rows.length > 0) {
      setTryDraft((d) => d ? { ...d, ingredients: [...rows!] } : d)
    }
  }

  async function analyzeFormula() {
    if (!tryDraft) return
    setIsAnalyzing(true)
    try {
      const result = await apiPost('/ai/recommendations/draft-tries', {
        projectName: projectMeta.name,
        targetFunction: projectMeta.objective,
        dosageForm: tryDraft.dosageForm,
        sourceFormula: { ingredients: tryDraft.ingredients }
      })
      setAnalysisResult(result)
      setShowAnalysisModal(true)
    } catch (e) {
      setNotice('AI 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleSaveAndLeave() {
    const saved = await saveTryDraftSilent()
    if (saved && blocker.proceed) {
      blocker.proceed()
    }
  }

  async function saveTryDraftSilent(): Promise<boolean> {
    if (!selectedTry || !tryDraft) return true
    try {
      const updated = await apiPatch<ApiFormulaTry, object>(
        `/projects/tries/${selectedTry.id}`,
        {
          title: tryDraft.title.trim() || null,
          dosageForm: tryDraft.dosageForm.trim() || null,
          memo: tryDraft.memo.trim() || null,
          ingredients: tryDraft.ingredients,
        },
      )
      const updatedRow = toTryRow(updated)
      setTries((current) => current.map((t) => (t.id === selectedTry.id ? updatedRow : t)))
      setTryDraft(toTryDraft(updatedRow))
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div className="page-heading-with-back">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/projects', { state: { restoreProjectsList: true } })}
          >
            ← 프로젝트 목록
          </button>
          <div>
            <h2>{projectMeta.name}</h2>
            <p>별표 Try {starredCount}건</p>
          </div>
        </div>
      </section>

      {/* 프로젝트 개요 */}
      <section className="workflow-panel project-meta-panel">
        <div className="panel-heading compact">
          <h3>프로젝트 개요</h3>
          <button
            type="button"
            className="primary-dashboard-button"
            disabled={!isMetaDirty || isSavingMeta}
            onClick={saveProjectMeta}
          >
            {isSavingMeta ? '저장 중...' : '저장'}
          </button>
        </div>
        {projectMeta.sourceProductId && (
          <div className="project-source-product">
            <span className="meta-label">기준 제품</span>
            <Link to={`/products/${projectMeta.sourceProductId}`}>
              {projectMeta.sourceProductName ?? projectMeta.sourceProductId}
            </Link>
          </div>
        )}
        <div className="project-meta-grid">
          <label>
            시작 배경
            <textarea
              value={metaDraft.background}
              onChange={(e) => setMetaDraft((prev) => ({ ...prev, background: e.target.value }))}
              placeholder="예: 한미약품 발주, 소비자 클레임 개선 등"
              rows={2}
            />
          </label>
          <label>
            개발 목표
            <textarea
              value={metaDraft.objective}
              onChange={(e) => setMetaDraft((prev) => ({ ...prev, objective: e.target.value }))}
              placeholder="예: 눈 건강 개선 연질캡슐 처방 확정"
              rows={2}
            />
          </label>
        </div>
      </section>

      {/* Try 작업 영역 */}
      <div className="project-try-layout">
        {/* 왼쪽: Try 목록 */}
        <section className="workflow-panel project-try-list-panel">
          <div className="panel-heading compact">
            <h3>Try 목록</h3>
            <button
              type="button"
              className="icon-action-btn"
              title="Try 추가"
              onClick={() => void handleAddTry()}
            >
              +
            </button>
          </div>

          <div className="try-list">
            {tries.map((tryRow) => {
              const displayTitle = selectedTryId === tryRow.id && tryDraft
                ? (tryDraft.title.trim() || `Try#${tryRow.tryNumber}`)
                : tryRow.title
              return (
                <button
                  key={tryRow.id}
                  type="button"
                  className={`try-list-item${selectedTryId === tryRow.id ? ' active' : ''}${tryRow.registeredProductId ? ' registered' : ''}`}
                  onClick={() => selectTry(tryRow)}
                >
                  <div className="try-list-header">
                    <span className="try-number">
                      Try#{tryRow.tryNumber}
                      {tryRow.registeredProductId && <span className="try-locked-icon" title="제품 등록됨"> 🔒</span>}
                    </span>
                    <button
                      type="button"
                      className={`star-btn${tryRow.starred ? ' starred' : ''}`}
                      aria-label={tryRow.starred ? '별표 해제' : '별표 추가'}
                      onClick={(e) => { e.stopPropagation(); void toggleStar(tryRow.id) }}
                    >
                      {tryRow.starred ? '★' : '☆'}
                    </button>
                  </div>
                  <div className="try-list-title">{displayTitle}</div>
                </button>
              )
            })}
            {tries.length === 0 && (
              <p className="empty-result">아직 Try가 없습니다.</p>
            )}
          </div>
        </section>

        {/* 오른쪽: Try 상세 */}
        <section className="workflow-panel project-try-detail-panel">
          {selectedTry && tryDraft ? (
            <form onSubmit={saveTryDraft}>
              <div className="panel-heading compact">
                <h3>Try#{selectedTry.tryNumber} {selectedTry.title}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!isLocked && (
                    <>
                      <button
                        type="button"
                        className="danger-text-btn"
                        onClick={() => {
                          if (window.confirm(`Try#${selectedTry.tryNumber}을 삭제할까요?`)) {
                            void deleteTry(selectedTry.id)
                          }
                        }}
                      >
                        삭제
                      </button>
                      <button
                        type="submit"
                        className="primary-dashboard-button"
                        disabled={!isDirty || isSaving}
                      >
                        {isSaving ? '저장 중...' : '저장'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isLocked && (
                <div className="try-locked-notice">
                  <span>이 Try는 제품/처방으로 등록되어 수정할 수 없습니다.</span>
                  <Link to={`/products/${selectedTry.registeredProductId}`}>
                    등록된 제품 보기 →
                  </Link>
                </div>
              )}

              <fieldset disabled={isLocked} className="try-fieldset">
                <div className="try-detail-grid">
                  <label>
                    Try 제목
                    <div className="input-with-clear">
                      <input
                        value={tryDraft.title}
                        onChange={(e) => setTryDraft((d) => d ? { ...d, title: e.target.value } : d)}
                        placeholder={`Try#${selectedTry.tryNumber}`}
                      />
                      {tryDraft.title && !isLocked && (
                        <button
                          type="button"
                          className="input-clear-btn"
                          aria-label="제목 지우기"
                          onClick={() => setTryDraft((d) => d ? { ...d, title: '' } : d)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </label>
                  <label>
                    제형
                    <CustomSelect
                      value={tryDraft.dosageForm}
                      options={[
                        { value: '', label: '없음' },
                        ...dosageFormOptions.map((opt) => ({ value: opt.name, label: opt.name })),
                      ]}
                      onChange={(v) => setTryDraft((d) => d ? { ...d, dosageForm: v } : d)}
                    />
                  </label>
                  <label className="wide-field">
                    메모
                    <textarea
                      value={tryDraft.memo}
                      onChange={(e) => setTryDraft((d) => d ? { ...d, memo: e.target.value } : d)}
                      rows={3}
                      placeholder="배합 변경 이유, 관능 관찰 내용 등"
                    />
                  </label>
                </div>
              </fieldset>

              <FormulaInputTable
                rows={tryDraft.ingredients}
                onChange={(rows) => setTryDraft((d) => d ? { ...d, ingredients: rows } : d)}
                readOnly={isLocked}
                onApplySourceRows={
                  projectMeta.sourceProductId && !isLocked && !isLoadingSourceRows
                    ? () => { void handleApplySourceRows() }
                    : undefined
                }
              />

              {!isLocked && (
                <div className="try-bottom-save">
                  <button
                    type="submit"
                    className="primary-dashboard-button"
                    disabled={!isDirty || isSaving}
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    className="primary-dashboard-button"
                    onClick={analyzeFormula}
                    disabled={isAnalyzing}
                    style={{ marginLeft: 8, backgroundColor: '#8a2be2' }}
                  >
                    {isAnalyzing ? '분석 중...' : 'AI 배합 분석 ✨'}
                  </button>
                </div>
              )}

              {/* 제품 등록 */}
              {!isLocked && (
                <div className="try-product-register">
                  <div className="try-product-register-inner">
                    <input
                      className="try-product-name-input"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="제품명을 입력하면 제품/처방으로 등록합니다"
                    />
                    <button
                      type="button"
                      className="primary-dashboard-button"
                      disabled={!productName.trim() || isRegisteringProduct}
                      onClick={() => setShowRegisterConfirm(true)}
                    >
                      {isRegisteringProduct ? '등록 중...' : '제품/처방 등록'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="try-detail-empty">
              <p>왼쪽 목록에서 Try를 선택하거나 새로 추가하세요.</p>
            </div>
          )}
        </section>
      </div>

      {notice ? (
        typeof notice === 'string' ? (
          <p className="local-notice" style={{ margin: '12px 0 0' }}>{notice}</p>
        ) : (
          <p className="local-notice" style={{ margin: '12px 0 0' }}>{notice}</p>
        )
      ) : null}

      {/* 제품 등록 확인 모달 */}
      {showRegisterConfirm && selectedTry && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="제품/처방 등록 확인"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRegisterConfirm(false) }}
        >
          <div className="modal-panel unsaved-modal">
            <h3>제품/처방으로 등록</h3>
            <p>
              <strong>{productName}</strong> 을(를) 제품/처방으로 등록합니다.<br />
              등록 후에는 Try#{selectedTry.tryNumber}의 내용을 수정할 수 없습니다.<br />
              계속하시겠습니까?
            </p>
            <div className="unsaved-leave-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowRegisterConfirm(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="primary-dashboard-button"
                onClick={() => {
                  setShowRegisterConfirm(false)
                  void doRegisterProduct()
                }}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 분석 결과 모달 */}
      {showAnalysisModal && analysisResult && (
        <div className="modal-backdrop" role="dialog" onClick={(e) => { if (e.target === e.currentTarget) setShowAnalysisModal(false) }}>
          <div className="modal-panel" style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>AI 배합 분석 결과 ✨</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{analysisResult.safetyNotice}</p>
            
            {analysisResult.safetySignals?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analysisResult.safetySignals.map((signal: any, idx: number) => (
                  <div key={idx} style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    backgroundColor: signal.severity === 'warning' ? '#fff3f3' : signal.severity === 'caution' ? '#fffbf0' : '#f0f7ff',
                    border: `1px solid ${signal.severity === 'warning' ? '#ffcdd2' : signal.severity === 'caution' ? '#ffecb3' : '#bbdefb'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: signal.severity === 'warning' ? '#d32f2f' : signal.severity === 'caution' ? '#f57c00' : '#1976d2' }}>
                        {signal.label}
                      </strong>
                      <span style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                        {signal.evidenceLevel}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>{signal.message}</p>
                    {signal.relatedIngredients?.length > 0 && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        관련 원료: {signal.relatedIngredients.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>분석된 특이사항이 없습니다.</p>
            )}
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button type="button" className="primary-dashboard-button" onClick={() => setShowAnalysisModal(false)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 저장 안 된 내용 경고 모달 */}
      {blocker.state === 'blocked' && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="저장 안 된 내용">
          <div className="modal-panel unsaved-modal">
            <h3>저장 안 된 내용이 있습니다</h3>
            <p>이 Try의 변경 사항이 저장되지 않았습니다. 어떻게 하시겠습니까?</p>
            <div className="unsaved-leave-actions">
              <button type="button" className="btn-secondary" onClick={() => blocker.reset?.()}>
                취소
              </button>
              <button type="button" className="btn-danger" onClick={() => blocker.proceed?.()}>
                나가기
              </button>
              <button type="button" className="primary-dashboard-button" onClick={handleSaveAndLeave}>
                저장 후 나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function toTryRow(apiTry: ApiFormulaTry): TryRow {
  return {
    id: apiTry.id,
    tryNumber: apiTry.tryNumber,
    title: apiTry.title?.trim() || `Try#${apiTry.tryNumber}`,
    dosageForm: apiTry.dosageForm?.trim() ?? '',
    memo: apiTry.memo?.trim() ?? '',
    starred: apiTry.starred ?? false,
    ingredients: toFormulaRows(apiTry.ingredients ?? []),
    registeredProductId: apiTry.sourceProducts?.[0]?.id ?? null,
  }
}

function productFormulaToRows(product: ApiProductWithFormulas): FormulaRow[] {
  const formula = product.formulas?.[0]
  if (!formula) return []
  return formula.ingredients
    .filter((i) => i.ingredient?.name?.trim())
    .map((i) => ({
      ingredientName: i.ingredient!.name!.trim(),
      amount: i.amount != null ? String(i.amount) : '',
      unit: i.unit?.trim() || 'mg',
      ratio: i.ratio != null ? String(i.ratio) : '',
      note: '',
    }))
}

function toFormulaRows(ingredients: ApiTryIngredient[]): FormulaRow[] {
  const rows = ingredients
    .filter((i) => i.ingredient?.name?.trim())
    .map((i) => ({
      ingredientName: i.ingredient?.name?.trim() ?? '',
      amount: i.amount !== null && i.amount !== undefined ? String(i.amount) : '',
      unit: i.unit?.trim() || 'mg',
      ratio: i.ratio !== null && i.ratio !== undefined ? String(i.ratio) : '',
      note: i.note?.trim() ?? '',
    }))

  return rows.length > 0 ? rows : [{ ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' }]
}
