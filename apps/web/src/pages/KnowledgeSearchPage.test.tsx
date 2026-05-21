import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../api/client'
import { KnowledgeSearchPage } from './KnowledgeSearchPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)
const apiPostMock = vi.mocked(apiPost)

describe('KnowledgeSearchPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiPostMock.mockReset()
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/evidence/import-jobs') {
        return []
      }

      return {
        query: '',
        results: [],
      }
    })
  })

  it('searches evidence candidates from a user query', async () => {
    const user = userEvent.setup()
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/evidence/import-jobs') {
        return []
      }

      return {
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
      }
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
    const searchResultCard = (await screen.findByRole('heading', {
      name: '비타민 C 고형제 안정성',
    })).closest('article')

    expect(searchResultCard).not.toBeNull()
    expect(
      within(searchResultCard as HTMLElement).getByText('정제 조건에서 산미와 색 변화 검토가 필요합니다.'),
    ).toBeInTheDocument()
    expect(within(searchResultCard as HTMLElement).getByText('MFDS')).toBeInTheDocument()
    expect(within(searchResultCard as HTMLElement).getByText('official')).toBeInTheDocument()
    expect(within(searchResultCard as HTMLElement).getByRole('link', { name: '원문 보기' })).toHaveAttribute(
      'href',
      'https://example.com/evidence',
    )
  })

  it('loads a query from the URL and shows a local fallback when the API is unavailable', async () => {
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/evidence/import-jobs') {
        return []
      }

      throw new Error('API offline')
    })

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

  it('registers an evidence source and item for reuse', async () => {
    const user = userEvent.setup()
    apiPostMock
      .mockResolvedValueOnce({
        id: 'source-1',
        name: 'MFDS',
        type: 'official',
        baseUrl: null,
      })
      .mockResolvedValueOnce({
        id: 'item-1',
        title: '비타민 C 기준 규격',
        summary: '고형제 기준 검토',
        sourceUrl: 'https://example.com/vitamin-c',
        grade: 'official',
        source: {
          id: 'source-1',
          name: 'MFDS',
          type: 'official',
        },
      })

    render(
      <MemoryRouter>
        <KnowledgeSearchPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('출처명'), 'MFDS')
    await user.type(screen.getByLabelText('근거 제목'), '비타민 C 기준 규격')
    await user.type(screen.getByLabelText('요약'), '고형제 기준 검토')
    await user.type(screen.getByLabelText('원문 URL'), 'https://example.com/vitamin-c')
    await user.click(screen.getByRole('button', { name: '근거 등록' }))

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenNthCalledWith(1, '/evidence/sources', {
        name: 'MFDS',
        type: 'official',
        baseUrl: null,
      })
    })
    expect(apiPostMock).toHaveBeenNthCalledWith(2, '/evidence/items', {
      sourceId: 'source-1',
      title: '비타민 C 기준 규격',
      summary: '고형제 기준 검토',
      rawText: '고형제 기준 검토',
      sourceUrl: 'https://example.com/vitamin-c',
      grade: 'official',
    })
    const registeredCard = (await screen.findByRole('heading', {
      name: '비타민 C 기준 규격',
    })).closest('article')

    expect(registeredCard).not.toBeNull()
    expect(within(registeredCard as HTMLElement).getByText('MFDS')).toBeInTheDocument()
    expect(within(registeredCard as HTMLElement).getByText('고형제 기준 검토')).toBeInTheDocument()
  })

  it('keeps a local evidence item when registration API is unavailable', async () => {
    const user = userEvent.setup()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter>
        <KnowledgeSearchPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('출처명'), '내부 실험')
    await user.type(screen.getByLabelText('근거 제목'), '아연 관능 메모')
    await user.click(screen.getByRole('button', { name: '근거 등록' }))

    expect(await screen.findByText('API 연결 실패로 로컬 근거 목록에만 반영됐습니다.')).toBeInTheDocument()
    const localCard = screen.getByRole('heading', { name: '아연 관능 메모' }).closest('article')

    expect(localCard).not.toBeNull()
    expect(within(localCard as HTMLElement).getByText('내부 실험')).toBeInTheDocument()
  })

  it('loads import jobs for external data collection status tracking', async () => {
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/evidence/import-jobs') {
        return [
          {
            id: 'job-1',
            sourceName: 'MFDS OpenAPI',
            status: 'IMPORTED',
            message: '1건 수집',
            startedAt: '2026-05-21T00:00:00.000Z',
            rawRecords: [{ id: 'record-1', normalizedStatus: 'PENDING' }],
          },
        ]
      }

      return {
        query: '',
        results: [],
      }
    })

    render(
      <MemoryRouter>
        <KnowledgeSearchPage />
      </MemoryRouter>,
    )

    const importJobCard = (await screen.findByRole('heading', { name: 'MFDS OpenAPI' })).closest(
      'article',
    )

    expect(importJobCard).not.toBeNull()
    expect(within(importJobCard as HTMLElement).getByText('IMPORTED')).toBeInTheDocument()
    expect(within(importJobCard as HTMLElement).getByText('원본 1건')).toBeInTheDocument()
    expect(within(importJobCard as HTMLElement).getByText('1건 수집')).toBeInTheDocument()
  })

  it('creates an import job from optional raw external data', async () => {
    const user = userEvent.setup()
    apiPostMock.mockResolvedValueOnce({
      id: 'job-2',
      sourceName: 'KIPRIS OpenAPI',
      status: 'IMPORTED',
      message: '특허 원문 수집',
      startedAt: '2026-05-21T01:00:00.000Z',
      rawRecords: [
        {
          id: 'record-2',
          normalizedStatus: 'PENDING',
        },
      ],
    })

    render(
      <MemoryRouter>
        <KnowledgeSearchPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('수집 출처'), 'KIPRIS OpenAPI')
    await user.type(screen.getByLabelText('수집 메모'), '특허 원문 수집')
    await user.type(screen.getByLabelText('외부 ID'), 'PAT-001')
    await user.type(screen.getByLabelText('원본 URL'), 'https://example.com/patent')
    fireEvent.change(screen.getByLabelText('원본 JSON'), {
      target: {
        value: '{"ingredient":"비타민 C"}',
      },
    })
    await user.click(screen.getByRole('button', { name: '수집 작업 등록' }))

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith('/evidence/import-jobs', {
        sourceName: 'KIPRIS OpenAPI',
        status: 'IMPORTED',
        message: '특허 원문 수집',
        records: [
          {
            externalId: 'PAT-001',
            sourceUrl: 'https://example.com/patent',
            rawPayload: { ingredient: '비타민 C' },
          },
        ],
      })
    })
    expect(await screen.findByRole('heading', { name: 'KIPRIS OpenAPI' })).toBeInTheDocument()
    expect(screen.getByText('원본 1건')).toBeInTheDocument()
  })

  it('keeps a local import job when the registration API is unavailable', async () => {
    const user = userEvent.setup()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter>
        <KnowledgeSearchPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('수집 출처'), '로컬 수집')
    await user.click(screen.getByRole('button', { name: '수집 작업 등록' }))

    expect(await screen.findByText('API 연결 실패로 로컬 수집 작업 목록에만 반영됐습니다.'))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '로컬 수집' })).toBeInTheDocument()
  })
})
