import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPatch } from '../api/client'
import './WorkflowPages.css'

type ProductStatus = 'CANDIDATE' | 'RELEASED' | 'PENDING_RELEASE' | 'UNDER_REVIEW' | 'DISCONTINUED'

type SourceTryInfo = {
  tryId: string
  tryNumber: number
  projectId: string
  projectName: string
}

type ProductSummary = {
  name: string
  headline: string
  description: string
  referenceNote: string
  status: ProductStatus
  sourceTry: SourceTryInfo | null
}

type MetadataDraft = {
  name: string
  description: string
  referenceNote: string
}

type FormulaRow = {
  ingredientName: string
  amount: string
  unit: string
  ratio: string
  role: string
}

type ApiProduct = {
  id: string
  name: string
  function?: string | null
  description?: string | null
  referenceNote?: string | null
  status?: ProductStatus | null
  dosageForm?: { name?: string | null } | null
  packaging?: { name?: string | null } | null
  formulas?: Array<{ ingredients?: ApiFormulaIngredient[] }>
  sourceTry?: {
    id: string
    tryNumber: number
    project?: { id: string; name: string } | null
  } | null
}

type ApiFormulaIngredient = {
  amount?: string | number | null
  unit?: string | null
  ratio?: string | number | null
  role?: string | null
  ingredient?: {
    name?: string | null
  } | null
}

type SimilarFormulaRecommendation = {
  productId: string
  productName: string
  formulaId: string
  formulaVersion: string
  similarityScore: number
  matchedIngredientCount: number
  reason: string
  matchedIngredients: SimilarFormulaIngredient[]
}

type SimilarFormulaIngredient = {
  ingredientName: string
  targetRatio: number
  candidateRatio: number
  ratioDifference: number
}


const referenceRows: FormulaRow[] = [
  { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '', role: '산미' },
  { ingredientName: '아연', amount: '', unit: 'mg', ratio: '', role: '선택값' },
]

const referenceSummary: ProductSummary = {
  name: '콜마 고형제 기준 처방',
  headline: '위 건강 · 츄어블 정제 · Multi PTP',
  description: '기존 제품 배합 정보를 기준 자산으로 관리',
  referenceNote: '',
  status: 'UNDER_REVIEW',
  sourceTry: null,
}

const fallbackNotice = 'API 연결 실패로 샘플 기준 처방을 표시합니다.'
const similarFallbackNotice = 'API 연결 실패로 로컬 유사 배합 후보를 표시합니다.'

const sampleSimilarRecommendations: SimilarFormulaRecommendation[] = [
  {
    productId: 'sample-similar-1',
    productName: '콜마 고형제 유사 처방',
    formulaId: 'sample-formula-1',
    formulaVersion: 'v1',
    similarityScore: 92,
    matchedIngredientCount: 2,
    reason: '공통 원료 2개, 평균 비율 차이 4.0',
    matchedIngredients: [
      {
        ingredientName: '비타민 C',
        targetRatio: 40,
        candidateRatio: 36,
        ratioDifference: 4,
      },
      {
        ingredientName: '아연',
        targetRatio: 10,
        candidateRatio: 12,
        ratioDifference: 2,
      },
    ],
  },
]


function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
      <path
        fillRule="evenodd"
        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
      />
    </svg>
  )
}

export function ProductDetailPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const [summary, setSummary] = useState(referenceSummary)
  const [metadataDraft, setMetadataDraft] = useState<MetadataDraft>({
    name: referenceSummary.name,
    description: referenceSummary.description,
    referenceNote: referenceSummary.referenceNote,
  })
  const [rows, setRows] = useState(referenceRows)
  const [notice, setNotice] = useState('')
  const [saveNotice, setSaveNotice] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [similarRecommendations, setSimilarRecommendations] = useState<
    SimilarFormulaRecommendation[]
  >([])
  const [similarNotice, setSimilarNotice] = useState('')
  const [savedMetadata, setSavedMetadata] = useState<MetadataDraft>({
    name: referenceSummary.name,
    description: referenceSummary.description,
    referenceNote: referenceSummary.referenceNote,
  })
  const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty =
    metadataDraft.name !== savedMetadata.name ||
    metadataDraft.description !== savedMetadata.description ||
    metadataDraft.referenceNote !== savedMetadata.referenceNote

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!productId) {
      return
    }

    let isActive = true

    async function loadProduct() {
      try {
        const product = await apiGet<ApiProduct>(`/products/${productId}`)

        if (!isActive) {
          return
        }

        const nextSummary = toProductSummary(product)
        const nextMetadata = {
          name: nextSummary.name,
          description: nextSummary.description,
          referenceNote: nextSummary.referenceNote,
        }

        setSummary(nextSummary)
        setMetadataDraft(nextMetadata)
        setSavedMetadata(nextMetadata)
        setRows(toFormulaRows(product))
        setNotice('')

        try {
          const recommendations = await apiGet<SimilarFormulaRecommendation[]>(
            `/products/${productId}/similar-formulas`,
          )

          if (!isActive) {
            return
          }

          setSimilarRecommendations(Array.isArray(recommendations) ? recommendations : [])
          setSimilarNotice('')
        } catch {
          if (!isActive) {
            return
          }

          setSimilarRecommendations(sampleSimilarRecommendations)
          setSimilarNotice(similarFallbackNotice)
        }

      } catch {
        if (isActive) {
          const fallbackMetadata = {
            name: referenceSummary.name,
            description: referenceSummary.description,
            referenceNote: referenceSummary.referenceNote,
          }
          setSummary(referenceSummary)
          setMetadataDraft(fallbackMetadata)
          setSavedMetadata(fallbackMetadata)
          setRows(referenceRows)
          setNotice(fallbackNotice)
          setSimilarRecommendations(sampleSimilarRecommendations)
          setSimilarNotice(similarFallbackNotice)
        }
      }
    }

    void loadProduct()

    return () => {
      isActive = false
    }
  }, [productId])

  async function handleStatusChange(newStatus: ProductStatus) {
    if (!productId) {
      return
    }

    setSummary((prev) => ({ ...prev, status: newStatus }))

    try {
      await apiPatch<ApiProduct, { status: ProductStatus }>(`/products/${productId}`, {
        status: newStatus,
      })
    } catch {
      // PoC: optimistic update stays, no rollback
    }
  }

  async function saveMetadata(): Promise<boolean> {
    if (!productId) {
      return false
    }

    setIsSaving(true)
    setSaveNotice('')

    try {
      const updatedProduct = await apiPatch<ApiProduct, MetadataDraft>(`/products/${productId}`, {
        name: metadataDraft.name,
        description: metadataDraft.description,
        referenceNote: metadataDraft.referenceNote,
      })
      const nextSummary = toProductSummary(updatedProduct)
      const nextMetadata = {
        name: nextSummary.name,
        description: nextSummary.description,
        referenceNote: nextSummary.referenceNote,
      }

      setSummary(nextSummary)
      setMetadataDraft(nextMetadata)
      setSavedMetadata(nextMetadata)
      setSaveNotice('제품 정보가 저장됐습니다.')
      return true
    } catch {
      setSaveNotice('저장에 실패했습니다. 다시 시도해주세요.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveMetadata()
  }

  async function handleSaveAndLeave() {
    const success = await saveMetadata()
    if (success) {
      blocker.proceed?.()
    }
  }

  async function handleSoftDelete() {
    if (!productId || deletePhrase !== '삭제합니다') {
      return
    }

    await apiDelete(`/products/${productId}`)
    navigate('/products')
  }

  function handleBackToList() {
    navigate('/products', { state: { restoreProductsList: true } })
  }

  return (
    <div className="workflow-page">
      <button type="button" className="back-button" onClick={handleBackToList}>
        제품 목록으로 돌아가기
      </button>

      <section className="page-heading">
        <div>
          <h2>{summary.name}</h2>
          <p>{summary.headline}</p>
        </div>
        <div className="heading-actions">
          <StatusSelect value={summary.status} onChange={handleStatusChange} />
          {productId ? (
            <Link className="workflow-primary-link" to={`/projects?sourceProductId=${productId}`}>
              이 제품으로 프로젝트 시작
            </Link>
          ) : null}
        </div>
      </section>

      {notice ? <p className="local-notice">{notice}</p> : null}

      {summary.sourceTry && (
        <section className="workflow-panel source-try-panel">
          <div className="panel-heading compact">
            <h3>출처 프로젝트</h3>
          </div>
          <div className="source-try-info">
            <Link to={`/projects/${summary.sourceTry.projectId}`}>
              {summary.sourceTry.projectName}
            </Link>
            <span className="source-try-divider">›</span>
            <Link to={`/projects/${summary.sourceTry.projectId}`}>
              try#{summary.sourceTry.tryNumber}
            </Link>
          </div>
        </section>
      )}

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>원료 배합 정보</h3>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsSimilarModalOpen(true)}
          >
            유사 배합 제품
          </button>
        </div>
        <div className="workflow-table-wrap">
          <table className="workflow-table">
            <thead>
              <tr>
                <th>원료명</th>
                <th>함량</th>
                <th>단위</th>
                <th>비율</th>
                <th>역할</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.ingredientName}-${index}`}>
                  <td>{row.ingredientName || '-'}</td>
                  <td>{row.amount || '-'}</td>
                  <td>{row.unit || '-'}</td>
                  <td>{row.ratio || '-'}</td>
                  <td>{row.role || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form className="workflow-panel" onSubmit={handleSaveMetadata}>
        <div className="panel-heading compact">
          <h3>제품 관리 정보</h3>
          <button
            type="submit"
            className="primary-dashboard-button"
            disabled={!isDirty || isSaving}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
        <div className="form-grid single-column">
          {summary.status === 'CANDIDATE' && (
            <label>
              제품명 <span className="candidate-edit-hint">(후보 상태에서만 수정 가능)</span>
              <input
                value={metadataDraft.name}
                onChange={(event) =>
                  setMetadataDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
          )}
          <label>
            제품 설명
            <textarea
              value={metadataDraft.description}
              onChange={(event) =>
                setMetadataDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label>
            참고 사항
            <textarea
              value={metadataDraft.referenceNote}
              onChange={(event) =>
                setMetadataDraft((current) => ({
                  ...current,
                  referenceNote: event.target.value,
                }))
              }
            />
          </label>
        </div>
        {saveNotice ? <p className="local-notice">{saveNotice}</p> : null}
      </form>

      <div className="product-delete-zone">
        <button
          type="button"
          className="product-delete-button"
          onClick={() => setIsDeleteOpen(true)}
        >
          <TrashIcon />
          제품 삭제
        </button>
      </div>

      {isDeleteOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="workflow-panel confirm-modal" aria-label="제품 삭제 확인">
            <div className="panel-heading compact">
              <h3>제품 삭제</h3>
              <span>소프트 삭제</span>
            </div>
            <p>삭제하려면 삭제합니다를 입력하세요.</p>
            <label>
              삭제 확인 문구
              <input value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setIsDeleteOpen(false)
                  setDeletePhrase('')
                }}
              >
                취소
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={deletePhrase !== '삭제합니다'}
                onClick={handleSoftDelete}
              >
                삭제 실행
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {blocker.state === 'blocked' ? (
        <div className="modal-backdrop" role="presentation">
          <section className="workflow-panel confirm-modal" aria-label="저장되지 않은 변경사항">
            <div className="panel-heading compact">
              <h3>저장되지 않은 변경사항</h3>
            </div>
            <p>수정된 내용이 저장되지 않았습니다. 어떻게 하시겠습니까?</p>
            <div className="form-actions unsaved-actions">
              <button type="button" className="secondary-button" onClick={() => blocker.reset?.()}>
                취소
              </button>
              <div className="unsaved-leave-actions">
                <button type="button" className="danger-button" onClick={() => blocker.proceed?.()}>
                  나가기
                </button>
                <button
                  type="button"
                  className="primary-dashboard-button"
                  disabled={isSaving}
                  onClick={() => void handleSaveAndLeave()}
                >
                  {isSaving ? '저장 중...' : '저장 후 나가기'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isSimilarModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsSimilarModalOpen(false)
          }}
        >
          <section className="workflow-panel similar-modal" aria-label="유사 배합 제품">
            <div className="panel-heading compact similar-modal-heading">
              <h3>유사 배합 제품</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{similarRecommendations.length}건</span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsSimilarModalOpen(false)}
                >
                  닫기
                </button>
              </div>
            </div>
            {similarNotice ? <p className="local-notice">{similarNotice}</p> : null}
            {similarRecommendations.length > 0 ? (
              <div className="similar-formula-list">
                {similarRecommendations.map((recommendation) => (
                  <article className="similar-formula-card" key={recommendation.formulaId}>
                    <div className="similar-formula-heading">
                      <h3>{recommendation.productName}</h3>
                      <span className="score-badge">{recommendation.similarityScore}%</span>
                    </div>
                    <div className="similar-formula-body">
                      <p>{recommendation.reason}</p>
                      <ul>
                        {recommendation.matchedIngredients.map((ingredient) => (
                          <li key={ingredient.ingredientName}>
                            {formatMatchedIngredient(ingredient)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-result">
                배합 비율이 있는 등록 제품이 쌓이면 유사 후보가 표시됩니다.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function toProductSummary(product: ApiProduct): ProductSummary {
  const sourceTry = product.sourceTry?.project
    ? {
        tryId: product.sourceTry.id,
        tryNumber: product.sourceTry.tryNumber,
        projectId: product.sourceTry.project.id,
        projectName: product.sourceTry.project.name,
      }
    : null

  return {
    name: product.name,
    headline: [
      product.function?.trim() || '기능성 미입력',
      product.dosageForm?.name?.trim() || '제형 미입력',
      product.packaging?.name?.trim() || '포장 미입력',
    ].join(' · '),
    description: product.description?.trim() ?? '',
    referenceNote: product.referenceNote?.trim() ?? '',
    status: product.status ?? 'UNDER_REVIEW',
    sourceTry,
  }
}

function toFormulaRows(product: ApiProduct): FormulaRow[] {
  const ingredients = product.formulas?.[0]?.ingredients ?? []
  const rows = ingredients
    .filter((ingredient) => ingredient.ingredient?.name?.trim())
    .map((ingredient) => ({
      ingredientName: ingredient.ingredient?.name?.trim() ?? '',
      amount: toFieldValue(ingredient.amount),
      unit: ingredient.unit?.trim() || 'mg',
      ratio: toFieldValue(ingredient.ratio),
      role: ingredient.role?.trim() ?? '',
    }))

  return rows.length > 0 ? rows : [{ ingredientName: '', amount: '', unit: '', ratio: '', role: '' }]
}

function toFieldValue(value?: string | number | null) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function formatMatchedIngredient(ingredient: SimilarFormulaIngredient) {
  return `${ingredient.ingredientName} ${formatRatio(ingredient.targetRatio)}% -> ${formatRatio(
    ingredient.candidateRatio,
  )}%`
}

function formatRatio(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'CANDIDATE', label: '후보' },
  { value: 'RELEASED', label: '출시' },
  { value: 'PENDING_RELEASE', label: '출시 대기' },
  { value: 'UNDER_REVIEW', label: '검수중' },
  { value: 'DISCONTINUED', label: '판매 중단' },
]

const STATUS_CLASS: Record<ProductStatus, string> = {
  CANDIDATE: 'status-opt-candidate',
  RELEASED: 'status-opt-released',
  PENDING_RELEASE: 'status-opt-pending',
  UNDER_REVIEW: 'status-opt-review',
  DISCONTINUED: 'status-opt-discontinued',
}

function StatusSelect({
  value,
  onChange,
}: {
  value: ProductStatus
  onChange: (status: ProductStatus) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const currentLabel = STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? value

  return (
    <div className="status-select-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`status-select-trigger ${STATUS_CLASS[value]}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {currentLabel}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          aria-hidden="true"
          style={{ opacity: 0.7, transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen ? (
        <div className="status-select-dropdown" role="listbox">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`status-select-option ${STATUS_CLASS[option.value]} ${option.value === value ? 'is-selected' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

