import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet } from '../api/client'
import { FormulaInputTable, type FormulaRow } from '../components/FormulaInputTable'
import './WorkflowPages.css'

type ProductSummary = {
  name: string
  description: string
}

type ApiProduct = {
  id: string
  name: string
  function?: string | null
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
  { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '', note: '산미' },
  { ingredientName: '아연', amount: '', unit: 'mg', ratio: '', note: '선택값' },
]

const emptyRow: FormulaRow = { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' }

const referenceSummary: ProductSummary = {
  name: '콜마 고형제 기준 처방',
  description: '기존 제품 배합 정보를 기준 자산으로 관리',
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
  const { productId } = useParams()
  const [summary, setSummary] = useState(referenceSummary)
  const [rows, setRows] = useState(referenceRows)
  const [notice, setNotice] = useState('')
  const [similarRecommendations, setSimilarRecommendations] = useState<
    SimilarFormulaRecommendation[]
  >([])
  const [similarNotice, setSimilarNotice] = useState('')
  const [formulationGuidance, setFormulationGuidance] = useState<FormulationGuidance | null>(null)
  const [formulationNotice, setFormulationNotice] = useState('')

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

        setSummary(toProductSummary(product))
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

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>{summary.name}</h2>
          <p>{summary.description}</p>
        </div>
        {productId ? (
          <Link className="workflow-primary-link" to={`/projects?sourceProductId=${productId}`}>
            이 제품으로 프로젝트 시작
          </Link>
        ) : null}
      </section>
      {notice ? <p className="local-notice">{notice}</p> : null}
      <FormulaInputTable rows={rows} onChange={setRows} />
      <section className="workflow-panel">
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
    </div>
  )
}

function toProductSummary(product: ApiProduct): ProductSummary {
  return {
    name: product.name,
    description: [
      product.function?.trim() || '기능성 미입력',
      product.dosageForm?.name?.trim() || '제형 미입력',
      product.packaging?.name?.trim() || '포장 미입력',
    ].join(' · '),
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
      note: ingredient.role?.trim() ?? '',
    }))

  return rows.length > 0 ? rows : [{ ...emptyRow }]
}

function toFieldValue(value?: string | number | null) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function formatMatchedIngredient(ingredient: SimilarFormulaIngredient) {
  return `${ingredient.ingredientName} ${formatRatio(ingredient.targetRatio)}% → ${formatRatio(
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
