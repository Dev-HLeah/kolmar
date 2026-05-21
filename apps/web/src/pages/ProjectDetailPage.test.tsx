import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiDelete, apiPost } from '../api/client'
import { ProjectDetailPage } from './ProjectDetailPage'

vi.mock('../api/client', () => ({
  apiDelete: vi.fn(),
  apiPost: vi.fn(),
}))

const apiDeleteMock = vi.mocked(apiDelete)
const apiPostMock = vi.mocked(apiPost)

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    apiDeleteMock.mockReset()
    apiPostMock.mockReset()
  })

  it('marks meaningful tries for project review', async () => {
    const user = userEvent.setup()
    render(<ProjectDetailPage />)

    await user.click(screen.getByRole('button', { name: 'try#2 마킹' }))

    expect(screen.getByText('의미 있는 Try 1건')).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: 'try#2 신물 억제 후보 마킹됨 try#2 마킹 try#2 삭제' }),
    ).toBeInTheDocument()
  })

  it('lets researchers add and delete tries manually', async () => {
    const user = userEvent.setup()
    apiPostMock.mockResolvedValueOnce({
      id: 'api-try-7',
      tryNumber: 7,
      title: '붕해 시간 개선 후보',
    })
    apiDeleteMock.mockResolvedValueOnce({ id: 'api-try-7' })

    render(<ProjectDetailPage />)

    await user.type(screen.getByLabelText('Try 목적'), '붕해 시간 개선 후보')
    await user.click(screen.getByRole('button', { name: 'Try 추가' }))

    expect(
      screen.getByRole('row', {
        name: 'try#7 붕해 시간 개선 후보 일반 try#7 마킹 try#7 삭제',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('try#1-7')).toBeInTheDocument()
    expect(apiPostMock).toHaveBeenCalledWith('/projects/groups/sample-group/tries', {
      tryNumber: 7,
      title: '붕해 시간 개선 후보',
      status: 'DRAFT',
    })

    await user.click(screen.getByRole('button', { name: 'try#7 삭제' }))

    expect(apiDeleteMock).toHaveBeenCalledWith('/projects/tries/api-try-7')
    expect(screen.queryByText('붕해 시간 개선 후보')).not.toBeInTheDocument()
    expect(screen.getByText('try#1-6')).toBeInTheDocument()
  })

  it('keeps local try changes visible when the API is unavailable', async () => {
    const user = userEvent.setup()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    render(<ProjectDetailPage />)

    await user.type(screen.getByLabelText('Try 목적'), '로컬 후보')
    await user.click(screen.getByRole('button', { name: 'Try 추가' }))

    expect(screen.getByText('로컬 후보')).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 로컬 화면에만 반영됐습니다.')).toBeInTheDocument()
  })
})
