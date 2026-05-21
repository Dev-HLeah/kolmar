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
    apiGetMock.mockResolvedValueOnce({
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
})
