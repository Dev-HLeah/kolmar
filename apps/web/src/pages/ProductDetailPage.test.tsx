import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiDelete, apiGet, apiPatch } from '../api/client'
import { ProductDetailPage } from './ProductDetailPage'

vi.mock('../api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}))

const apiDeleteMock = vi.mocked(apiDelete)
const apiGetMock = vi.mocked(apiGet)
const apiPatchMock = vi.mocked(apiPatch)

function renderProductDetail(productId = 'product-api-1') {
  return render(
    <MemoryRouter initialEntries={[`/products/${productId}`]}>
      <Routes>
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/products" element={<p>제품 목록 화면</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    apiDeleteMock.mockReset()
    apiGetMock.mockReset()
    apiPatchMock.mockReset()
  })

  it('loads product details as a read-only finished-product formula', async () => {
    mockProductApis()

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: 'API 제품 처방' })).toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/products/product-api-1')
    expect(screen.getByText('위 건강 · 이중 제형 정제 · Multi PTP')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '비타민 C' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '500' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '40' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '산미' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '아연' })).toBeInTheDocument()
    expect(screen.queryByLabelText('원료명 1')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '음성 입력' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '원료 행 추가' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '유사 배합 제품' })).toBeInTheDocument()
  })

  it('keeps navigation actions for returning to the list and starting a new project from this product', async () => {
    const user = userEvent.setup()
    mockProductApis()

    renderProductDetail()

    expect(await screen.findByRole('link', { name: '이 제품으로 프로젝트 시작' })).toHaveAttribute(
      'href',
      '/projects?sourceProductId=product-api-1',
    )

    await user.click(screen.getByRole('button', { name: '제품 목록으로 돌아가기' }))

    expect(screen.getByText('제품 목록 화면')).toBeInTheDocument()
  })

  it('saves editable product description, reference note, and status only', async () => {
    const user = userEvent.setup()
    mockProductApis()
    apiPatchMock.mockResolvedValueOnce({
      ...apiProductFixture(),
      description: '섭취 편의성 개선 대상',
      referenceNote: '관능 테스트 우선 확인',
      status: 'RELEASED',
    })

    renderProductDetail()

    await user.clear(await screen.findByLabelText('제품 설명'))
    await user.type(screen.getByLabelText('제품 설명'), '섭취 편의성 개선 대상')
    await user.clear(screen.getByLabelText('참고 사항'))
    await user.type(screen.getByLabelText('참고 사항'), '관능 테스트 우선 확인')
    await user.selectOptions(screen.getByLabelText('상태'), 'RELEASED')
    await user.click(screen.getByRole('button', { name: '제품 정보 저장' }))

    expect(apiPatchMock).toHaveBeenCalledWith('/products/product-api-1', {
      description: '섭취 편의성 개선 대상',
      referenceNote: '관능 테스트 우선 확인',
      status: 'RELEASED',
    })
    expect(await screen.findByText('제품 정보가 저장됐습니다.')).toBeInTheDocument()
  })

  it('soft deletes a product only after the exact confirmation phrase is entered', async () => {
    const user = userEvent.setup()
    mockProductApis()
    apiDeleteMock.mockResolvedValueOnce({ id: 'product-api-1' })

    renderProductDetail()

    await user.click(await screen.findByRole('button', { name: '제품 삭제' }))

    expect(screen.getByText('삭제하려면 삭제합니다를 입력하세요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제 실행' })).toBeDisabled()

    await user.type(screen.getByLabelText('삭제 확인 문구'), '삭제합니다')
    await user.click(screen.getByRole('button', { name: '삭제 실행' }))

    await waitFor(() => {
      expect(apiDeleteMock).toHaveBeenCalledWith('/products/product-api-1')
    })
    expect(screen.getByText('제품 목록 화면')).toBeInTheDocument()
  })

  it('keeps the sample formula visible when the API is unavailable', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('API offline'))

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: '콜마 고형제 기준 처방' })).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 샘플 기준 처방을 표시합니다.')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '비타민 C' })).toBeInTheDocument()
  })

  it('loads similar formula recommendations from the product formula profile', async () => {
    mockProductApis({
      similarRecommendations: [
        {
          productId: 'product-api-2',
          productName: '유사 제품 처방',
          formulaId: 'formula-2',
          formulaVersion: 'v1',
          similarityScore: 98,
          matchedIngredientCount: 2,
          reason: '공통 원료 2개, 평균 비율 차이 2.0',
          matchedIngredients: [
            {
              ingredientName: '비타민 C',
              targetRatio: 40,
              candidateRatio: 38,
              ratioDifference: 2,
            },
          ],
        },
      ],
    })

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: '유사 배합 추천' })).toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/products/product-api-1/similar-formulas')
    expect(screen.getByRole('heading', { name: '유사 제품 처방' })).toBeInTheDocument()
    expect(screen.getByText('유사도 98%')).toBeInTheDocument()
    expect(screen.getByText('공통 원료 2개, 평균 비율 차이 2.0')).toBeInTheDocument()
    expect(screen.getByText('비타민 C 40% -> 38%')).toBeInTheDocument()
  })

  it('loads dosage form stability guidance for Kolmar specialized formulas', async () => {
    mockProductApis({
      product: apiProductFixture({
        dosageFormName: '츄어블 정제',
        packagingName: 'Multi PTP',
      }),
      guidance: {
        productId: 'product-api-1',
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
      },
    })

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: '제형 안정성 가이드' })).toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/products/product-api-1/formulation-guidance')
    expect(screen.getByText('츄어블 정제 · Multi PTP')).toBeInTheDocument()
    expect(screen.getByText('콜마 특화 제형')).toBeInTheDocument()
    expect(screen.getByText('맛 마스킹 필요')).toBeInTheDocument()
    expect(
      screen.getByText(
        '산미 또는 관능 이슈가 있는 원료가 포함되어 츄어블 정제에서 맛 마스킹 확인이 필요합니다.',
      ),
    ).toBeInTheDocument()
  })
})

function mockProductApis({
  product = apiProductFixture(),
  similarRecommendations = [],
  guidance = guidanceFixture(),
}: {
  product?: ReturnType<typeof apiProductFixture>
  similarRecommendations?: unknown[]
  guidance?: unknown
} = {}) {
  apiGetMock.mockImplementation(async (path) => {
    if (path === '/products/product-api-1/similar-formulas') {
      return similarRecommendations
    }

    if (path === '/products/product-api-1/formulation-guidance') {
      return guidance
    }

    return product
  })
}

function apiProductFixture({
  dosageFormName = '이중 제형 정제',
  packagingName = 'Multi PTP',
}: {
  dosageFormName?: string
  packagingName?: string
} = {}) {
  return {
    id: 'product-api-1',
    name: 'API 제품 처방',
    function: '위 건강',
    description: '기존 제품 설명',
    referenceNote: '참고 사항',
    status: 'UNDER_REVIEW',
    dosageForm: { name: dosageFormName },
    packaging: { name: packagingName },
    formulas: [
      {
        version: 'v1',
        ingredients: [
          {
            amount: '500',
            unit: 'mg',
            ratio: '40',
            role: '산미',
            ingredient: { name: '비타민 C' },
          },
          {
            amount: null,
            unit: 'mg',
            ratio: null,
            role: '선택값',
            ingredient: { name: '아연' },
          },
        ],
      },
    ],
  }
}

function guidanceFixture() {
  return {
    productId: 'product-api-1',
    dosageFormName: '이중 제형 정제',
    packagingName: 'Multi PTP',
    kolmarSpecial: true,
    summary: '이중 제형 정제 기반으로 콜마 특화 제형과 초기 안정성 신호를 검토합니다.',
    signals: [],
  }
}
