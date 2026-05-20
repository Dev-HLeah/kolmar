import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductsPage } from './ProductsPage'

describe('ProductsPage', () => {
  it('adds a product draft with optional formula rows', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('제품명'), '위 건강 정제')
    await user.type(screen.getByLabelText('기능성'), '신물 억제')
    await user.type(screen.getByLabelText('원료명 1'), '비타민 C')
    await user.click(screen.getByRole('button', { name: '제품 등록' }))

    expect(screen.getByRole('row', { name: '위 건강 정제 정제 신물 억제 1개' })).toBeInTheDocument()
  })
})
