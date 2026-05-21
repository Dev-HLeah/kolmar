import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../api/client'
import { ProductDetailPage } from './ProductDetailPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)

function renderProductDetail(productId = 'product-api-1') {
  return render(
    <MemoryRouter initialEntries={[`/products/${productId}`]}>
      <Routes>
        <Route path="/products/:productId" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  it('loads registered product formula details from the API', async () => {
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/products/product-api-1/similar-formulas') {
        return []
      }

      if (path === '/products/product-api-1/formulation-guidance') {
        return {
          productId: 'product-api-1',
          dosageFormName: '이중 제형 정제',
          packagingName: 'Multi PTP',
          kolmarSpecial: true,
          summary: '이중 제형 정제 기반으로 콜마 특화 제형과 초기 안정성 신호를 검토합니다.',
          signals: [],
        }
      }

      return {
        id: 'product-api-1',
        name: 'API 제품 처방',
        function: '위 건강',
        dosageForm: { name: '이중 제형 정제' },
        packaging: { name: 'Multi PTP' },
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
    })

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: 'API 제품 처방' })).toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/products/product-api-1')
    expect(screen.getByText('위 건강 · 이중 제형 정제 · Multi PTP')).toBeInTheDocument()
    expect(screen.getByLabelText('원료명 1')).toHaveValue('비타민 C')
    expect(screen.getByLabelText('함량 1')).toHaveValue('500')
    expect(screen.getByLabelText('비율 1')).toHaveValue('40')
    expect(screen.getByLabelText('메모 1')).toHaveValue('산미')
    expect(screen.getByLabelText('원료명 2')).toHaveValue('아연')
  })

  it('keeps the sample formula visible when the API is unavailable', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('API offline'))

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: '콜마 고형제 기준 처방' })).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 샘플 기준 처방을 표시합니다.')).toBeInTheDocument()
    expect(screen.getByLabelText('원료명 1')).toHaveValue('비타민 C')
  })

  it('loads similar formula recommendations from the product formula profile', async () => {
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/products/product-api-1/similar-formulas') {
        return [
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
        ]
      }

      if (path === '/products/product-api-1/formulation-guidance') {
        return {
          productId: 'product-api-1',
          dosageFormName: '이중 제형 정제',
          packagingName: 'Multi PTP',
          kolmarSpecial: true,
          summary: '이중 제형 정제 기반으로 콜마 특화 제형과 초기 안정성 신호를 검토합니다.',
          signals: [],
        }
      }

      return {
        id: 'product-api-1',
        name: 'API 제품 처방',
        function: '위 건강',
        dosageForm: { name: '이중 제형 정제' },
        packaging: { name: 'Multi PTP' },
        formulas: [
          {
            ingredients: [
              {
                ratio: '40',
                unit: 'mg',
                ingredient: { name: '비타민 C' },
              },
            ],
          },
        ],
      }
    })

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: '유사 배합 추천' })).toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/products/product-api-1/similar-formulas')
    expect(screen.getByRole('heading', { name: '유사 제품 처방' })).toBeInTheDocument()
    expect(screen.getByText('유사도 98%')).toBeInTheDocument()
    expect(screen.getByText('공통 원료 2개, 평균 비율 차이 2.0')).toBeInTheDocument()
    expect(screen.getByText('비타민 C 40% → 38%')).toBeInTheDocument()
  })

  it('loads dosage form stability guidance for Kolmar specialized formulas', async () => {
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/products/product-api-1/similar-formulas') {
        return []
      }

      if (path === '/products/product-api-1/formulation-guidance') {
        return {
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
        }
      }

      return {
        id: 'product-api-1',
        name: 'API 제품 처방',
        function: '위 건강',
        dosageForm: { name: '츄어블 정제' },
        packaging: { name: 'Multi PTP' },
        formulas: [
          {
            ingredients: [
              {
                ratio: '40',
                role: '산미',
                ingredient: { name: '비타민 C' },
              },
            ],
          },
        ],
      }
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
