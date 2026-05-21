import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiPost } from '../api/client'
import { ProductsPage } from './ProductsPage'

vi.mock('../api/client', () => ({
  apiPost: vi.fn(),
}))

const apiPostMock = vi.mocked(apiPost)

describe('ProductsPage', () => {
  beforeEach(() => {
    apiPostMock.mockReset()
  })

  it('adds a product draft with optional formula rows', async () => {
    const user = userEvent.setup()
    apiPostMock.mockResolvedValueOnce({
      id: 'product-api-1',
      name: '위 건강 정제',
      function: '신물 억제',
      dosageForm: { name: '정제' },
      formulas: [
        {
          ingredients: [
            {
              ingredient: {
                name: '비타민 C',
              },
            },
          ],
        },
      ],
    })

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('제품명'), '위 건강 정제')
    await user.type(screen.getByLabelText('기능성'), '신물 억제')
    await user.type(screen.getByLabelText('원료명 1'), '비타민 C')
    await user.click(screen.getByRole('button', { name: '제품 등록' }))

    expect(apiPostMock).toHaveBeenCalledWith('/products', {
      name: '위 건강 정제',
      target: null,
      function: '신물 억제',
      dosageFormName: '정제',
      packagingName: '스틱 포장',
      formulaVersion: 'v1',
      ingredients: [
        {
          ingredientName: '비타민 C',
          amount: null,
          unit: 'mg',
          ratio: null,
          note: null,
        },
      ],
    })
    expect(screen.getByRole('row', { name: '위 건강 정제 정제 신물 억제 1개' })).toBeInTheDocument()
  })

  it('keeps a local product draft when the API is unavailable', async () => {
    const user = userEvent.setup()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('제품명'), '로컬 제품')
    await user.click(screen.getByRole('button', { name: '제품 등록' }))

    expect(screen.getByRole('row', { name: '로컬 제품 정제 기능성 미입력 0개' })).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 로컬 화면에만 반영됐습니다.')).toBeInTheDocument()
  })
})
