import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPatch } from '../api/client'
import './WorkflowPages.css'

type ProductStatus = 'RELEASED' | 'PENDING_RELEASE' | 'UNDER_REVIEW' | 'DISCONTINUED'

type ProductSummary = {
  name: string
  headline: string
  description: string
  referenceNote: string
  status: ProductStatus
}

type MetadataDraft = {
  description: string
  referenceNote: string
  status: ProductStatus
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
  dosageForm?: {
    name?: string | null
  } | null
  packaging?: {
    name?: string | null
  } | null
  formulas?: Array<{
    ingredients?: ApiFormulaIngredient[]
  }>
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

type FormulationGuidance = {
  productId: string
  dosageFormName: string
  packagingName: string
  kolmarSpecial: boolean
  summary: string
  signals: FormulationSignal[]
}

type FormulationSignal = {
  type: string
  label: string
  severity: string
  message: string
  checkItems: string[]
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
}

const fallbackNotice = 'API 연결 실패로 샘플 기준 처방을 표시합니다.'
const similarFallbackNotice = 'API 연결 실패로 로컬 유사 배합 후보를 표시합니다.'
const formulationFallbackNotice = 'API 연결 실패로 로컬 제형 가이드를 표시합니다.'

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

const sampleFormulationGuidance: FormulationGuidance = {
  productId: 'sample-product-1',
  dosageFormName: '츄어블 정제',
  packagingName: 'Multi PTP',
  kolmarSpecial: true,
  summary: '츄어블 정제 기반으로 콜마 특화 제형과 초기 안정성 신호를 검토합니다.',
  signals: [
    {
      type: 'kolmar-dosage-form',
      label: '콜마 특화 제형',
      severity: 'positive',
      message: '츄어블 정제는 콜마 특화 제형 후보입니다.',
      checkItems: ['맛 마스킹', '정제 경도', '붕해/용해'],
    },
    {
      type: 'taste-masking',
      label: '맛 마스킹 필요',
      severity: 'caution',
      message:
        '산미 또는 관능 이슈가 있는 원료가 포함되어 츄어블 정제에서 맛 마스킹 확인이 필요합니다.',
      checkItems: ['산미', '쓴맛', '감미료 조화'],
    },
  ],
}

export function ProductDetailPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const [summary, setSummary] = useState(referenceSummary)
  const [metadataDraft, setMetadataDraft] = useState<MetadataDraft>({
    description: referenceSummary.description,
    referenceNote: referenceSummary.referenceNote,
    status: referenceSummary.status,
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
  const [formulationGuidance, setFormulationGuidance] = useState<FormulationGuidance | null>(null)
  const [formulationNotice, setFormulationNotice] = useState('')

  const statusLabel = useMemo(() => toStatusLabel(summary.status), [summary.status])

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

        setSummary(nextSummary)
        setMetadataDraft({
          description: nextSummary.description,
          referenceNote: nextSummary.referenceNote,
          status: nextSummary.status,
        })
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

        try {
          const guidance = await apiGet<FormulationGuidance>(
            `/products/${productId}/formulation-guidance`,
          )

          if (!isActive) {
            return
          }

          setFormulationGuidance(guidance)
          setFormulationNotice('')
        } catch {
          if (!isActive) {
            return
          }

          setFormulationGuidance(sampleFormulationGuidance)
          setFormulationNotice(formulationFallbackNotice)
        }
      } catch {
        if (isActive) {
          setSummary(referenceSummary)
          setMetadataDraft({
            description: referenceSummary.description,
            referenceNote: referenceSummary.referenceNote,
            status: referenceSummary.status,
          })
          setRows(referenceRows)
          setNotice(fallbackNotice)
          setSimilarRecommendations(sampleSimilarRecommendations)
          setSimilarNotice(similarFallbackNotice)
          setFormulationGuidance(sampleFormulationGuidance)
          setFormulationNotice(formulationFallbackNotice)
        }
      }
    }

    void loadProduct()

    return () => {
      isActive = false
    }
  }, [productId])

  async function handleSaveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!productId) {
      return
    }

    setSaveNotice('')
    const updatedProduct = await apiPatch<ApiProduct, MetadataDraft>(`/products/${productId}`, {
      description: metadataDraft.description,
      referenceNote: metadataDraft.referenceNote,
      status: metadataDraft.status,
    })
    const nextSummary = toProductSummary(updatedProduct)

    setSummary(nextSummary)
    setMetadataDraft({
      description: nextSummary.description,
      referenceNote: nextSummary.referenceNote,
      status: nextSummary.status,
    })
    setSaveNotice('제품 정보가 저장됐습니다.')
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

  function focusSimilarProducts() {
    document.getElementById('similar-formulas')?.scrollIntoView({ behavior: 'smooth' })
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
          <span className="status-pill">{statusLabel}</span>
          {productId ? (
            <Link className="workflow-primary-link" to={`/projects?sourceProductId=${productId}`}>
              이 제품으로 프로젝트 시작
            </Link>
          ) : null}
        </div>
      </section>
      {notice ? <p className="local-notice">{notice}</p> : null}

      <section className="product-detail-grid">
        <section className="workflow-panel">
          <div className="panel-heading compact">
            <h3>제품 배합 정보</h3>
            <button type="button" className="secondary-button" onClick={focusSimilarProducts}>
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
            <span>수정 가능</span>
          </div>
          <div className="form-grid single-column">
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
            <label>
              상태
              <select
                value={metadataDraft.status}
                onChange={(event) =>
                  setMetadataDraft((current) => ({
                    ...current,
                    status: event.target.value as ProductStatus,
                  }))
                }
              >
                <option value="RELEASED">출시</option>
                <option value="PENDING_RELEASE">출시 대기</option>
                <option value="UNDER_REVIEW">검수중</option>
                <option value="DISCONTINUED">판매 중단</option>
              </select>
            </label>
          </div>
          {saveNotice ? <p className="local-notice">{saveNotice}</p> : null}
          <div className="form-actions">
            <button type="button" className="danger-button" onClick={() => setIsDeleteOpen(true)}>
              제품 삭제
            </button>
            <button type="submit" className="primary-dashboard-button">
              제품 정보 저장
            </button>
          </div>
        </form>
      </section>

      <section className="workflow-panel" id="similar-formulas">
        <div className="panel-heading compact">
          <h3>유사 배합 추천</h3>
          <span>{similarRecommendations.length}건</span>
        </div>
        {similarNotice ? <p className="local-notice">{similarNotice}</p> : null}
        {similarRecommendations.length > 0 ? (
          <div className="similar-formula-list">
            {similarRecommendations.map((recommendation) => (
              <article className="similar-formula-card" key={recommendation.formulaId}>
                <div className="similar-formula-heading">
                  <h3>{recommendation.productName}</h3>
                  <span className="status-pill">유사도 {recommendation.similarityScore}%</span>
                </div>
                <p>{recommendation.reason}</p>
                <ul>
                  {recommendation.matchedIngredients.map((ingredient) => (
                    <li key={ingredient.ingredientName}>{formatMatchedIngredient(ingredient)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-result">배합 비율이 있는 등록 제품이 쌓이면 유사 후보가 표시됩니다.</p>
        )}
      </section>
      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>제형 안정성 가이드</h3>
          <span>{formulationGuidance?.signals.length ?? 0}건</span>
        </div>
        {formulationNotice ? <p className="local-notice">{formulationNotice}</p> : null}
        {formulationGuidance ? (
          <div className="formulation-guidance">
            <div>
              <p className="guidance-context">
                {formulationGuidance.dosageFormName} · {formulationGuidance.packagingName}
              </p>
              <p className="guidance-summary">{formulationGuidance.summary}</p>
            </div>
            <div className="similar-formula-list">
              {formulationGuidance.signals.map((signal) => (
                <article className="similar-formula-card" key={signal.type}>
                  <div className="similar-formula-heading">
                    <h3>{signal.label}</h3>
                    <span className="status-pill">{toSeverityLabel(signal.severity)}</span>
                  </div>
                  <p>{signal.message}</p>
                  <ul>
                    {signal.checkItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="empty-result">제형과 원료 정보가 쌓이면 초기 안정성 신호가 표시됩니다.</p>
        )}
      </section>

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
    </div>
  )
}

function toProductSummary(product: ApiProduct): ProductSummary {
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

function toSeverityLabel(severity: string) {
  if (severity === 'positive') {
    return '추천'
  }

  if (severity === 'caution') {
    return '주의'
  }

  return '검토'
}

function toStatusLabel(status: ProductStatus) {
  const statusLabels: Record<ProductStatus, string> = {
    RELEASED: '출시',
    PENDING_RELEASE: '출시 대기',
    UNDER_REVIEW: '검수중',
    DISCONTINUED: '판매 중단',
  }

  return statusLabels[status]
}
