import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../api/client'
import { ProductsPage } from './ProductsPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)
const apiPostMock = vi.mocked(apiPost)

describe('ProductsPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiPostMock.mockReset()
  })

  it('loads registered product assets from the API', async () => {
    apiGetMock.mockResolvedValueOnce([
      {
        id: 'api-product-1',
        name: 'API 고형제 처방',
        function: '위 건강',
        dosageForm: { name: '이중 제형 정제' },
        formulas: [
          {
            ingredients: [{ ingredient: { name: '비타민 C' } }, { ingredient: { name: '아연' } }],
          },
        ],
      },
    ])

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('row', { name: 'API 고형제 처방 이중 제형 정제 위 건강 2개' }))
      .toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/products')
  })

  it('keeps the sample product list when the API list is unavailable', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('row', { name: '콜마 고형제 기준 처방 츄어블 정제 위 건강 3개' }),
    ).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 샘플 제품 목록을 표시합니다.')).toBeInTheDocument()
  })

  it('adds a product draft with optional formula rows', async () => {
    const user = userEvent.setup()
    apiGetMock.mockResolvedValueOnce([])
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
    apiGetMock.mockResolvedValueOnce([])
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
