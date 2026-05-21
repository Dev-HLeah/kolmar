import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../api/client'
import { KnowledgeSearchPage } from './KnowledgeSearchPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)

describe('KnowledgeSearchPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  it('searches evidence candidates from a user query', async () => {
    const user = userEvent.setup()
    apiGetMock.mockResolvedValueOnce({
      query: '비타민 C',
      results: [
        {
          id: 'evidence-1',
          title: '비타민 C 고형제 안정성',
          summary: '정제 조건에서 산미와 색 변화 검토가 필요합니다.',
          source: 'MFDS',
          sourceUrl: 'https://example.com/evidence',
          grade: 'official',
          matchType: 'structured',
        },
      ],
    })

    render(
      <MemoryRouter>
        <KnowledgeSearchPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('검색어'), '비타민 C')
    await user.click(screen.getByRole('button', { name: '근거 검색' }))

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith('/search?q=%EB%B9%84%ED%83%80%EB%AF%BC%20C')
    })
    expect(await screen.findByRole('heading', { name: '비타민 C 고형제 안정성' }))
      .toBeInTheDocument()
    expect(screen.getByText('정제 조건에서 산미와 색 변화 검토가 필요합니다.')).toBeInTheDocument()
    expect(screen.getByText('MFDS')).toBeInTheDocument()
    expect(screen.getByText('official')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '원문 보기' })).toHaveAttribute(
      'href',
      'https://example.com/evidence',
    )
  })

  it('loads a query from the URL and shows a local fallback when the API is unavailable', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter initialEntries={['/knowledge?q=아연']}>
        <KnowledgeSearchPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith('/search?q=%EC%95%84%EC%97%B0')
    })
    expect(await screen.findByText('API 연결 실패로 로컬 근거 후보를 표시합니다.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '아연 관련 로컬 근거 후보' })).toBeInTheDocument()
    expect(screen.getByText('mock-vector')).toBeInTheDocument()
  })
})
