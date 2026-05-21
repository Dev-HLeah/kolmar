import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../api/client'
import { AuditLogPage } from './AuditLogPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)

describe('AuditLogPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  it('loads recent audit logs for admins', async () => {
    apiGetMock.mockResolvedValueOnce([
      {
        id: 'log-1',
        action: 'PRODUCT_CREATED',
        targetType: 'Product',
        targetId: 'product-1',
        summary: '제품/처방 생성: 위 건강 정제',
        createdAt: '2026-05-21T00:00:00.000Z',
      },
    ])

    render(
      <MemoryRouter>
        <AuditLogPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '운영 로그' })).toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/audit-logs')

    const row = screen.getByRole('row', {
      name: 'PRODUCT_CREATED 제품/처방 생성: 위 건강 정제 Product product-1 2026-05-21T00:00:00.000Z',
    })
    expect(within(row).getByText('PRODUCT_CREATED')).toBeInTheDocument()
    expect(within(row).getByText('제품/처방 생성: 위 건강 정제')).toBeInTheDocument()
  })

  it('shows a local notice when audit logs cannot be loaded', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter>
        <AuditLogPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('API 연결 실패로 운영 로그를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.getByText('표시할 운영 로그가 없습니다.')).toBeInTheDocument()
  })
})
