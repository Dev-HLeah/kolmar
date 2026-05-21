import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPost } from '../api/client'
import { FormulaInputTable, type FormulaRow } from '../components/FormulaInputTable'
import './WorkflowPages.css'

type ProductDraft = {
  id: string
  name: string
  function: string
  dosageForm: string
  ingredientCount: number
}

type ApiProduct = {
  id: string
  name: string
  function?: string | null
  dosageForm?: {
    name?: string | null
  } | null
  formulas?: Array<{
    ingredients?: unknown[]
  }>
}

const initialRows: FormulaRow[] = [
  { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
]

const seededProducts: ProductDraft[] = [
  {
    id: 'sample-1',
    name: '콜마 고형제 기준 처방',
    function: '위 건강',
    dosageForm: '츄어블 정제',
    ingredientCount: 3,
  },
]

const localOnlyNotice = 'API 연결 실패로 로컬 화면에만 반영됐습니다.'

export function ProductsPage() {
  const [name, setName] = useState('')
  const [functionalClaim, setFunctionalClaim] = useState('')
  const [target, setTarget] = useState('')
  const [dosageForm, setDosageForm] = useState('정제')
  const [packaging, setPackaging] = useState('스틱 포장')
  const [rows, setRows] = useState(initialRows)
  const [products, setProducts] = useState<ProductDraft[]>(seededProducts)
  const [notice, setNotice] = useState('')

  const ingredientCount = useMemo(
    () => rows.filter((row) => row.ingredientName.trim()).length,
    [rows],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const draftProduct: ProductDraft = {
      id: `draft-${products.length + 1}`,
      name: name.trim() || '제품명 미입력',
      function: functionalClaim.trim() || '기능성 미입력',
      dosageForm,
      ingredientCount,
    }
    const ingredients = rows
      .filter((row) => row.ingredientName.trim())
      .map((row) => ({
        ingredientName: row.ingredientName.trim(),
        amount: nullableText(row.amount),
        unit: nullableText(row.unit),
        ratio: nullableText(row.ratio),
        note: nullableText(row.note),
      }))

    try {
      const createdProduct = await apiPost<
        ApiProduct,
        {
          name: string
          target: string | null
          function: string | null
          dosageFormName: string
          packagingName: string
          formulaVersion: string
          ingredients: typeof ingredients
        }
      >('/products', {
        name: draftProduct.name,
        target: nullableText(target),
        function: nullableText(functionalClaim),
        dosageFormName: dosageForm,
        packagingName: packaging,
        formulaVersion: 'v1',
        ingredients,
      })

      const createdFormula = createdProduct.formulas?.[0]
      const nextProduct: ProductDraft = {
        id: createdProduct.id,
        name: createdProduct.name,
        function: createdProduct.function?.trim() || draftProduct.function,
        dosageForm: createdProduct.dosageForm?.name?.trim() || draftProduct.dosageForm,
        ingredientCount: createdFormula?.ingredients?.length ?? draftProduct.ingredientCount,
      }

      setProducts((current) => [nextProduct, ...current])
      setNotice('')
    } catch {
      setProducts((current) => [draftProduct, ...current])
      setNotice(localOnlyNotice)
    }

    setName('')
    setFunctionalClaim('')
    setTarget('')
    setRows(initialRows)
  }

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>제품/처방</h2>
          <p>기존 제품 원료와 배합 정보를 등록하고 신규 프로젝트의 기준으로 사용</p>
        </div>
      </section>

      <section className="workflow-grid">
        <form className="workflow-panel" onSubmit={handleSubmit}>
          <div className="panel-heading compact">
            <h3>제품 기본 정보</h3>
            <span>등록</span>
          </div>
          <div className="form-grid">
            <label>
              제품명
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              기능성
              <input
                value={functionalClaim}
                onChange={(event) => setFunctionalClaim(event.target.value)}
              />
            </label>
            <label>
              대상
              <input value={target} onChange={(event) => setTarget(event.target.value)} />
            </label>
            <label>
              제형
              <select value={dosageForm} onChange={(event) => setDosageForm(event.target.value)}>
                <option value="정제">정제</option>
                <option value="츄어블 정제">츄어블 정제</option>
                <option value="이중 제형 정제">이중 제형 정제</option>
                <option value="분말">분말</option>
                <option value="쿨멜팅 분말">쿨멜팅 분말</option>
              </select>
            </label>
            <label>
              포장
              <select value={packaging} onChange={(event) => setPackaging(event.target.value)}>
                <option value="스틱 포장">스틱 포장</option>
                <option value="Multi PTP">Multi PTP</option>
                <option value="PTP">PTP</option>
              </select>
            </label>
          </div>
          <FormulaInputTable rows={rows} onChange={setRows} />
          {notice ? <p className="local-notice">{notice}</p> : null}
          <div className="form-actions">
            <span>{target || packaging}</span>
            <button type="submit" className="primary-dashboard-button">
              제품 등록
            </button>
          </div>
        </form>

        <section className="workflow-panel">
          <div className="panel-heading compact">
            <h3>등록 제품</h3>
            <span>{products.length}건</span>
          </div>
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>제품명</th>
                  <th>제형</th>
                  <th>기능성</th>
                  <th>원료</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link to={`/products/${product.id}`}>{product.name}</Link>
                    </td>
                    <td>{product.dosageForm}</td>
                    <td>{product.function}</td>
                    <td>{product.ingredientCount}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  )
}

function nullableText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
