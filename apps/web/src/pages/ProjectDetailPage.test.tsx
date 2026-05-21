import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiDelete, apiGet, apiPost } from '../api/client'
import { ProjectDetailPage } from './ProjectDetailPage'

vi.mock('../api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const apiDeleteMock = vi.mocked(apiDelete)
const apiGetMock = vi.mocked(apiGet)
const apiPostMock = vi.mocked(apiPost)

function renderProjectDetail(projectId = 'project-api-1') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockProjectDetail() {
  apiGetMock.mockResolvedValueOnce({
    id: 'project-api-1',
    name: 'API 신물 억제 개발',
    function: '위 건강',
    desiredForm: '정제',
    groups: [
      {
        id: 'api-group-1',
        name: 'API 신물 억제 그룹',
        tries: [
          {
            id: 'api-try-1',
            tryNumber: 1,
            title: '기준 처방',
            marks: [],
          },
          {
            id: 'api-try-2',
            tryNumber: 2,
            title: 'API 후보',
            marks: [{ id: 'mark-1' }],
          },
        ],
      },
    ],
  })
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    apiDeleteMock.mockReset()
    apiGetMock.mockReset()
    apiPostMock.mockReset()
  })

  it('loads project detail tries and marks from the API', async () => {
    mockProjectDetail()

    renderProjectDetail()

    expect(await screen.findByRole('heading', { name: 'API 신물 억제 개발' })).toBeInTheDocument()
    expect(apiGetMock).toHaveBeenCalledWith('/projects/project-api-1')
    expect(screen.getByText('API 신물 억제 그룹')).toBeInTheDocument()
    expect(screen.getByText('의미 있는 Try 1건')).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: 'try#2 API 후보 마킹됨 try#2 마킹 try#2 삭제' }),
    ).toBeInTheDocument()
  })

  it('marks meaningful tries for project review', async () => {
    const user = userEvent.setup()
    mockProjectDetail()
    apiPostMock.mockResolvedValueOnce({
      id: 'api-mark-1',
      tryId: 'api-try-1',
      type: 'PROMISING',
    })

    renderProjectDetail()

    await screen.findByText('API 후보')

    await user.click(screen.getByRole('button', { name: 'try#1 마킹' }))

    expect(apiPostMock).toHaveBeenCalledWith('/projects/tries/api-try-1/marks', {
      type: 'PROMISING',
      reason: '의미 있는 시도로 마킹',
    })
    expect(screen.getByText('의미 있는 Try 2건')).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: 'try#1 기준 처방 마킹됨 try#1 마킹 try#1 삭제' }),
    ).toBeInTheDocument()
  })

  it('keeps a local mark when the mark API is unavailable', async () => {
    const user = userEvent.setup()
    mockProjectDetail()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    renderProjectDetail()

    await screen.findByText('API 후보')
    await user.click(screen.getByRole('button', { name: 'try#1 마킹' }))

    expect(screen.getByText('의미 있는 Try 2건')).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 로컬 화면에만 반영됐습니다.')).toBeInTheDocument()
  })

  it('lets researchers add and delete tries manually', async () => {
    const user = userEvent.setup()
    mockProjectDetail()
    apiPostMock.mockResolvedValueOnce({
      id: 'api-try-3',
      tryNumber: 3,
      title: '붕해 시간 개선 후보',
    })
    apiDeleteMock.mockResolvedValueOnce({ id: 'api-try-3' })

    renderProjectDetail()

    await screen.findByText('API 후보')

    await user.type(screen.getByLabelText('Try 목적'), '붕해 시간 개선 후보')
    await user.click(screen.getByRole('button', { name: 'Try 추가' }))

    expect(
      screen.getByRole('row', {
        name: 'try#3 붕해 시간 개선 후보 일반 try#3 마킹 try#3 삭제',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('try#1-3')).toBeInTheDocument()
    expect(apiPostMock).toHaveBeenCalledWith('/projects/groups/api-group-1/tries', {
      tryNumber: 3,
      title: '붕해 시간 개선 후보',
      status: 'DRAFT',
    })

    await user.click(screen.getByRole('button', { name: 'try#3 삭제' }))

    expect(apiDeleteMock).toHaveBeenCalledWith('/projects/tries/api-try-3')
    expect(screen.queryByText('붕해 시간 개선 후보')).not.toBeInTheDocument()
    expect(screen.getByText('try#1-2')).toBeInTheDocument()
  })

  it('keeps local try changes visible when the API is unavailable', async () => {
    const user = userEvent.setup()
    apiGetMock.mockRejectedValueOnce(new Error('API offline'))
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    renderProjectDetail()

    expect(await screen.findByText('API 연결 실패로 샘플 프로젝트를 표시합니다.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Try 목적'), '로컬 후보')
    await user.click(screen.getByRole('button', { name: 'Try 추가' }))

    expect(screen.getByText('로컬 후보')).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 로컬 화면에만 반영됐습니다.')).toBeInTheDocument()
  })
})
