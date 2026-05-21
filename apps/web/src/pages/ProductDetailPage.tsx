import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

export function ProductDetailPage() {
  const { productId } = useParams()
  const [summary, setSummary] = useState(referenceSummary)
  const [rows, setRows] = useState(referenceRows)
  const [notice, setNotice] = useState('')

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
      } catch {
        if (isActive) {
          setSummary(referenceSummary)
          setRows(referenceRows)
          setNotice(fallbackNotice)
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
      </section>
      {notice ? <p className="local-notice">{notice}</p> : null}
      <FormulaInputTable rows={rows} onChange={setRows} />
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
