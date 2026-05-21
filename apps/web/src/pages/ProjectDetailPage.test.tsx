import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import { ProjectDetailPage } from './ProjectDetailPage'

vi.mock('../api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

const apiDeleteMock = vi.mocked(apiDelete)
const apiGetMock = vi.mocked(apiGet)
const apiPatchMock = vi.mocked(apiPatch)
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
        purpose: '위 건강 후보',
        tries: [
          {
            id: 'api-try-1',
            tryNumber: 1,
            status: 'PLANNED',
            title: '기준 처방',
            dosageForm: '정제',
            manufacturingProcess: '직타',
            memo: '초기 기준',
            ingredients: [
              {
                amount: '500',
                unit: 'mg',
                ratio: '40',
                note: '산미',
                ingredient: {
                  name: '비타민 C',
                },
              },
            ],
            testResults: [
              {
                id: 'result-1',
                testPurpose: '초기 확인',
                measuredItem: '붕해 시간',
                measuredValue: '12',
                unit: '분',
                judgment: '적합',
                memo: '기준 통과',
                createdAt: '2026-05-21T00:00:00.000Z',
              },
            ],
            marks: [],
          },
          {
            id: 'api-try-2',
            tryNumber: 2,
            status: 'CANDIDATE',
            title: 'API 후보',
            testResults: [],
            marks: [{ id: 'mark-1' }],
          },
        ],
      },
      {
        id: 'api-group-2',
        name: '맛 개선 그룹',
        purpose: '관능 개선',
        tries: [
          {
            id: 'api-try-10',
            tryNumber: 10,
            status: 'TESTED',
            title: '감미료 조정',
            dosageForm: '정제',
            manufacturingProcess: '직타',
            memo: '단맛 보완',
            ingredients: [],
            testResults: [],
            marks: [],
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
    apiPatchMock.mockReset()
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
      screen.getByRole('row', { name: 'try#2 API 후보 후보 마킹됨 try#2 마킹 try#2 삭제' }),
    ).toBeInTheDocument()
  })

  it('shows marked tries as a project-level filtered view', async () => {
    const user = userEvent.setup()
    mockProjectDetail()

    renderProjectDetail()

    await screen.findByText('API 후보')
    await user.click(screen.getByRole('button', { name: '의미 있는 Try만 보기' }))

    expect(
      screen.getByRole('row', { name: 'try#2 API 후보 후보 마킹됨 try#2 마킹 try#2 삭제' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('row', {
        name: 'try#1 기준 처방 테스트 예정 일반 try#1 마킹 try#1 삭제',
      }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '전체 Try 보기' }))

    expect(
      screen.getByRole('row', {
        name: 'try#1 기준 처방 테스트 예정 일반 try#1 마킹 try#1 삭제',
      }),
    ).toBeInTheDocument()
  })

  it('filters tries by workflow status', async () => {
    const user = userEvent.setup()
    mockProjectDetail()

    renderProjectDetail()

    await screen.findByText('API 후보')
    await user.selectOptions(screen.getByLabelText('Try 상태 필터'), 'CANDIDATE')

    expect(
      screen.getByRole('row', { name: 'try#2 API 후보 후보 마킹됨 try#2 마킹 try#2 삭제' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('row', {
        name: 'try#1 기준 처방 테스트 예정 일반 try#1 마킹 try#1 삭제',
      }),
    ).not.toBeInTheDocument()
  })

  it('switches between experiment groups and shows group-specific tries', async () => {
    const user = userEvent.setup()
    mockProjectDetail()

    renderProjectDetail()

    await screen.findByText('API 후보')
    await user.click(screen.getByRole('button', { name: '맛 개선 그룹' }))

    expect(screen.getByText('try#1-10')).toBeInTheDocument()
    expect(
      screen.getByRole('row', {
        name: 'try#10 감미료 조정 테스트 완료 일반 try#10 마킹 try#10 삭제',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('row', {
        name: 'try#1 기준 처방 테스트 예정 일반 try#1 마킹 try#1 삭제',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('결과 등록 Try')).toHaveValue('10')
  })

  it('creates a new experiment group from the project detail screen', async () => {
    const user = userEvent.setup()
    mockProjectDetail()
    apiPostMock.mockResolvedValueOnce({
      id: 'api-group-3',
      name: '안정성 개선 그룹',
      purpose: '가속 안정성',
      tries: [],
    })

    renderProjectDetail()

    await screen.findByText('API 후보')
    await user.type(screen.getByLabelText('실험 그룹명'), '안정성 개선 그룹')
    await user.type(screen.getByLabelText('그룹 목적'), '가속 안정성')
    await user.click(screen.getByRole('button', { name: '그룹 추가' }))

    expect(apiPostMock).toHaveBeenCalledWith('/projects/project-api-1/groups', {
      name: '안정성 개선 그룹',
      purpose: '가속 안정성',
    })
    expect(screen.getByRole('button', { name: '안정성 개선 그룹' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('try 없음')).toBeInTheDocument()
    expect(screen.getByText('마킹된 Try 없음')).toBeInTheDocument()
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
      screen.getByRole('row', {
        name: 'try#1 기준 처방 테스트 예정 마킹됨 try#1 마킹 try#1 삭제',
      }),
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
        name: 'try#3 붕해 시간 개선 후보 초안 일반 try#3 마킹 try#3 삭제',
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

  it('registers optional test results for a selected try', async () => {
    const user = userEvent.setup()
    mockProjectDetail()
    apiPostMock.mockResolvedValueOnce({
      id: 'result-1',
      tryId: 'api-try-1',
      testPurpose: null,
      measuredItem: '붕해 시간',
      measuredValue: '12',
      unit: null,
      judgment: '적합',
      memo: null,
      createdAt: '2026-05-21T00:10:00.000Z',
    })

    renderProjectDetail()

    await screen.findByText('API 후보')

    await user.selectOptions(screen.getByLabelText('결과 등록 Try'), '1')
    await user.type(screen.getByLabelText('측정 항목'), '붕해 시간')
    await user.type(screen.getByLabelText('측정값'), '12')
    await user.type(screen.getByLabelText('판정'), '적합')
    await user.click(screen.getByRole('button', { name: '테스트 결과 등록' }))

    expect(apiPostMock).toHaveBeenCalledWith('/projects/tries/api-try-1/test-results', {
      testPurpose: null,
      measuredItem: '붕해 시간',
      measuredValue: '12',
      unit: null,
      judgment: '적합',
      memo: null,
    })
    expect(screen.getByText('테스트 결과가 등록됐습니다.')).toBeInTheDocument()
    expect(
      screen.getByRole('row', {
        name: 'try#1 - 붕해 시간 12 적합 -',
      }),
    ).toBeInTheDocument()
  })

  it('shows loaded try test result history', async () => {
    mockProjectDetail()

    renderProjectDetail()

    await screen.findByText('API 후보')

    expect(screen.getByRole('heading', { name: '테스트 결과 이력' })).toBeInTheDocument()
    expect(
      screen.getByRole('row', {
        name: 'try#1 초기 확인 붕해 시간 12 분 적합 기준 통과',
      }),
    ).toBeInTheDocument()
  })

  it('saves selected try formula details with optional ingredient rows', async () => {
    const user = userEvent.setup()
    mockProjectDetail()
    apiPatchMock.mockResolvedValueOnce({
      id: 'api-try-1',
      tryNumber: 1,
      status: 'CANDIDATE',
      title: '기준 처방 개선',
      dosageForm: '츄어블 정제',
      manufacturingProcess: '직타',
      memo: '쓴맛 보완',
      ingredients: [
        {
          amount: '500',
          unit: 'mg',
          ratio: '40',
          note: '산미',
          ingredient: {
            name: '비타민 C',
          },
        },
      ],
      marks: [],
    })

    renderProjectDetail()

    await screen.findByText('API 후보')

    expect(screen.getByRole('heading', { name: 'Try 배합 정보' })).toBeInTheDocument()
    expect(screen.getByLabelText('원료명 1')).toHaveValue('비타민 C')

    await user.clear(screen.getByLabelText('Try 제목'))
    await user.type(screen.getByLabelText('Try 제목'), '기준 처방 개선')
    await user.clear(screen.getByLabelText('제형'))
    await user.type(screen.getByLabelText('제형'), '츄어블 정제')
    await user.clear(screen.getByLabelText('Try 메모'))
    await user.type(screen.getByLabelText('Try 메모'), '쓴맛 보완')
    await user.selectOptions(screen.getByLabelText('Try 상태'), 'CANDIDATE')
    await user.click(screen.getByRole('button', { name: 'Try 배합 저장' }))

    expect(apiPatchMock).toHaveBeenCalledWith('/projects/tries/api-try-1', {
      status: 'CANDIDATE',
      title: '기준 처방 개선',
      dosageForm: '츄어블 정제',
      manufacturingProcess: '직타',
      memo: '쓴맛 보완',
      ingredients: [
        {
          ingredientName: '비타민 C',
          amount: '500',
          unit: 'mg',
          ratio: '40',
          note: '산미',
        },
      ],
    })
    expect(screen.getByText('Try 배합 정보가 저장됐습니다.')).toBeInTheDocument()
    expect(
      screen.getByRole('row', {
        name: 'try#1 기준 처방 개선 후보 일반 try#1 마킹 try#1 삭제',
      }),
    ).toBeInTheDocument()
  })

  it('keeps test result entry local when the API is unavailable', async () => {
    const user = userEvent.setup()
    mockProjectDetail()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    renderProjectDetail()

    await screen.findByText('API 후보')
    await user.type(screen.getByLabelText('측정 항목'), '색')
    await user.click(screen.getByRole('button', { name: '테스트 결과 등록' }))

    expect(screen.getByText('API 연결 실패로 로컬 화면에만 반영됐습니다.')).toBeInTheDocument()
    expect(
      screen.getByRole('row', {
        name: 'try#1 - 색 - - -',
      }),
    ).toBeInTheDocument()
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
