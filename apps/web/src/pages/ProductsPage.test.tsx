import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../api/client'
import { ProductsPage } from './ProductsPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)

describe('ProductsPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads registered products from the API without showing a product registration form', async () => {
    apiGetMock.mockResolvedValueOnce([
      productFixture({
        id: 'api-product-1',
        name: 'API 고형제 처방',
        dosageFormName: '이중 제형 정제',
        ingredientNames: ['비타민 C', '아연'],
      }),
    ])

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: 'API 고형제 처방' })).toHaveAttribute(
      'href',
      '/products/api-product-1',
    )
    expect(screen.getByText('이중 제형 정제')).toBeInTheDocument()
    expect(screen.getByText('비타민 C, 아연')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '제품 등록' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('기능성')).not.toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/products')
  })

  it('filters registered products by product name, dosage form, and ingredient', async () => {
    const user = userEvent.setup()
    apiGetMock.mockResolvedValueOnce([
      productFixture({
        id: 'product-1',
        name: '위 건강 츄어블',
        dosageFormName: '츄어블 정제',
        ingredientNames: ['비타민 C', '아연'],
      }),
      productFixture({
        id: 'product-2',
        name: '눈 건강 정제',
        dosageFormName: '정제',
        ingredientNames: ['루테인'],
      }),
    ])

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: '위 건강 츄어블' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '눈 건강 정제' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('제품명 검색'), '위 건강')

    expect(screen.getByRole('link', { name: '위 건강 츄어블' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '눈 건강 정제' })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('제품명 검색'))
    await user.type(screen.getByLabelText('제형 검색'), '츄어블')

    expect(screen.getByRole('link', { name: '위 건강 츄어블' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '눈 건강 정제' })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('제형 검색'))
    await user.type(screen.getByLabelText('원료 검색'), '루테인')

    expect(screen.queryByRole('link', { name: '위 건강 츄어블' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '눈 건강 정제' })).toBeInTheDocument()
  })

  it('restores product search filters when returning from a product detail page', async () => {
    apiGetMock.mockResolvedValueOnce([
      productFixture({
        id: 'product-1',
        name: '위 건강 츄어블',
        dosageFormName: '츄어블 정제',
        ingredientNames: ['비타민 C'],
      }),
    ])
    window.sessionStorage.setItem(
      'kolma:products-list-state',
      JSON.stringify({
        filters: {
          name: '위 건강',
          dosageForm: '츄어블',
          ingredient: '비타민',
        },
        scrollY: 240,
      }),
    )
    const scrollToMock = vi.fn()
    vi.stubGlobal('scrollTo', scrollToMock)

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/products', state: { restoreProductsList: true } }]}
      >
        <ProductsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText('제품명 검색')).toHaveValue('위 건강')
    expect(screen.getByLabelText('제형 검색')).toHaveValue('츄어블')
    expect(screen.getByLabelText('원료 검색')).toHaveValue('비타민')
    await waitFor(() => expect(scrollToMock).toHaveBeenCalledWith(0, 240))
  })

  it('keeps the sample product list when the API list is unavailable', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: '콜마 고형제 기준 처방' })).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 샘플 제품 목록을 표시합니다.')).toBeInTheDocument()
  })
})

function productFixture({
  id,
  name,
  dosageFormName,
  ingredientNames,
}: {
  id: string
  name: string
  dosageFormName: string
  ingredientNames: string[]
}) {
  return {
    id,
    name,
    function: '위 건강',
    status: 'UNDER_REVIEW',
    dosageForm: { name: dosageFormName },
    formulas: [
      {
        ingredients: ingredientNames.map((ingredientName) => ({
          ingredient: { name: ingredientName },
        })),
      },
    ],
  }
}
