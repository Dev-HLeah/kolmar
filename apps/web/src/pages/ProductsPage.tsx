import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiGet } from '../api/client'
import './WorkflowPages.css'

type ProductStatus = 'RELEASED' | 'PENDING_RELEASE' | 'UNDER_REVIEW' | 'DISCONTINUED'

type ProductRecord = {
  id: string
  name: string
  function: string
  dosageForm: string
  ingredientNames: string[]
  status: ProductStatus
}

type ProductFilters = {
  name: string
  dosageForm: string
  ingredient: string
}

type ApiProduct = {
  id: string
  name: string
  function?: string | null
  status?: ProductStatus | null
  dosageForm?: {
    name?: string | null
  } | null
  formulas?: Array<{
    ingredients?: Array<{
      ingredient?: {
        name?: string | null
      } | null
    }>
  }>
}

const productListStateKey = 'kolma:products-list-state'

const defaultFilters: ProductFilters = {
  name: '',
  dosageForm: '',
  ingredient: '',
}

const seededProducts: ProductRecord[] = [
  {
    id: 'sample-1',
    name: '콜마 고형제 기준 처방',
    function: '위 건강',
    dosageForm: '츄어블 정제',
    ingredientNames: ['비타민 C', '아연', '마그네슘'],
    status: 'UNDER_REVIEW',
  },
]

const listFallbackNotice = 'API 연결 실패로 샘플 제품 목록을 표시합니다.'

export function ProductsPage() {
  const location = useLocation()
  const shouldRestoreList = Boolean(
    (location.state as { restoreProductsList?: boolean } | null)?.restoreProductsList,
  )
  const [filters, setFilters] = useState<ProductFilters>(() =>
    shouldRestoreList ? (readProductListState()?.filters ?? defaultFilters) : defaultFilters,
  )
  const [products, setProducts] = useState<ProductRecord[]>(seededProducts)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (shouldRestoreList) {
      const savedState = readProductListState()

      if (!savedState) {
        return
      }

      window.setTimeout(() => {
        window.scrollTo(0, savedState.scrollY)
      }, 0)
      return
    }

    window.sessionStorage.removeItem(productListStateKey)
  }, [shouldRestoreList])

  useEffect(() => {
    let isActive = true

    async function loadProducts() {
      try {
        const apiProducts = await apiGet<ApiProduct[]>('/products')

        if (!isActive) {
          return
        }

        setProducts(apiProducts.map((product) => toProductRecord(product)))
        setNotice('')
      } catch {
        if (!isActive) {
          return
        }

        setProducts(seededProducts)
        setNotice(listFallbackNotice)
      }
    }

    void loadProducts()

    return () => {
      isActive = false
    }
  }, [])

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const nameMatched = includesText(product.name, filters.name)
        const dosageFormMatched = includesText(product.dosageForm, filters.dosageForm)
        const ingredientMatched = includesText(product.ingredientNames.join(' '), filters.ingredient)

        return nameMatched && dosageFormMatched && ingredientMatched
      }),
    [filters, products],
  )

  function updateFilter(key: keyof ProductFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function saveListState() {
    window.sessionStorage.setItem(
      productListStateKey,
      JSON.stringify({
        filters,
        scrollY: window.scrollY,
      }),
    )
  }

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>제품/처방</h2>
          <p>등록된 완제품 처방을 검색하고 신규 프로젝트의 기준으로 사용</p>
        </div>
      </section>

      <section className="product-library-layout">
        <section className="workflow-panel product-library-panel">
          <div className="panel-heading compact">
            <h3>등록 제품</h3>
            <span>{filteredProducts.length}건</span>
          </div>
          <div className="product-search-grid">
            <label>
              제품명 검색
              <input
                value={filters.name}
                onChange={(event) => updateFilter('name', event.target.value)}
                placeholder="제품명"
              />
            </label>
            <label>
              제형 검색
              <input
                value={filters.dosageForm}
                onChange={(event) => updateFilter('dosageForm', event.target.value)}
                placeholder="정제, 츄어블"
              />
            </label>
            <label>
              원료 검색
              <input
                value={filters.ingredient}
                onChange={(event) => updateFilter('ingredient', event.target.value)}
                placeholder="비타민 C, 아연"
              />
            </label>
          </div>
          {notice ? <p className="local-notice">{notice}</p> : null}
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>제품명</th>
                  <th>제형</th>
                  <th>원료</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link to={`/products/${product.id}`} onClick={saveListState}>
                        {product.name}
                      </Link>
                    </td>
                    <td>{product.dosageForm}</td>
                    <td>{formatIngredientNames(product.ingredientNames)}</td>
                    <td>{toStatusLabel(product.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="empty-result">검색 조건에 맞는 등록 제품이 없습니다.</p>
          ) : null}
        </section>

        <aside className="workflow-panel product-context-panel">
          <div className="panel-heading compact">
            <h3>제품 기준 작업</h3>
            <span>완제품</span>
          </div>
          <dl className="summary-list">
            <div>
              <dt>전체 등록 제품</dt>
              <dd>{products.length}건</dd>
            </div>
            <div>
              <dt>검색 결과</dt>
              <dd>{filteredProducts.length}건</dd>
            </div>
            <div>
              <dt>수정 가능 정보</dt>
              <dd>제품 설명, 참고 사항, 상태</dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  )
}

function readProductListState() {
  const rawState = window.sessionStorage.getItem(productListStateKey)

  if (!rawState) {
    return null
  }

  try {
    const parsedState = JSON.parse(rawState) as {
      filters?: Partial<ProductFilters>
      scrollY?: number
    }

    return {
      filters: {
        ...defaultFilters,
        ...parsedState.filters,
      },
      scrollY: parsedState.scrollY ?? 0,
    }
  } catch {
    return null
  }
}

function includesText(value: string, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return value.toLocaleLowerCase().includes(normalizedQuery)
}

function formatIngredientNames(ingredientNames: string[]) {
  return ingredientNames.length > 0 ? ingredientNames.join(', ') : '원료 미입력'
}

function toProductRecord(product: ApiProduct): ProductRecord {
  const createdFormula = product.formulas?.[0]
  const ingredientNames =
    createdFormula?.ingredients
      ?.map((ingredient) => ingredient.ingredient?.name?.trim())
      .filter((ingredientName): ingredientName is string => Boolean(ingredientName)) ?? []

  return {
    id: product.id,
    name: product.name,
    function: product.function?.trim() || '기능성 미입력',
    dosageForm: product.dosageForm?.name?.trim() || '제형 미입력',
    ingredientNames,
    status: product.status ?? 'UNDER_REVIEW',
  }
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
