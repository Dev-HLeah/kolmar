import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../api/client'
import { DashboardPage } from './DashboardPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)
const apiPostMock = vi.mocked(apiPost)

describe('DashboardPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockResolvedValue([])
    apiPostMock.mockReset()
  })

  function renderDashboard() {
    return render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
  }

  it('loads workflow metrics from registered products projects and import jobs', async () => {
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/products') {
        return [{ id: 'product-1' }, { id: 'product-2' }]
      }

      if (path === '/projects') {
        return [
          {
            id: 'project-1',
            groups: [{ tries: [{ id: 'try-1' }, { id: 'try-2' }] }],
          },
          {
            id: 'project-2',
            groups: [{ tries: [{ id: 'try-3' }] }],
          },
        ]
      }

      if (path === '/evidence/import-jobs') {
        return [
          {
            id: 'job-1',
            rawRecords: [{ id: 'record-1' }, { id: 'record-2' }],
          },
          {
            id: 'job-2',
            rawRecords: [{ id: 'record-3' }],
          },
        ]
      }

      return []
    })

    renderDashboard()

    expect(await screen.findByRole('figure', { name: '등록 제품 2' })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: '진행 프로젝트 2' })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: '계획 Try 3' })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: '근거 자료 3' })).toBeInTheDocument()
  })

  it('requests draft try recommendations from formula inputs', async () => {
    const user = userEvent.setup()
    apiPostMock.mockResolvedValueOnce({
      projectName: '신물 억제',
      safetyNotice: 'AI 추천은 연구 후보 초안입니다.',
      candidates: [
        {
          title: '안정성 우선 후보',
          objective: '상한과 독성 가능성을 먼저 확인',
          suggestedChanges: ['고위험 원료 증량 보류'],
          riskChecks: ['일일 섭취량 상한'],
        },
      ],
    })

    renderDashboard()

    await user.type(screen.getByLabelText('원료명 1'), '비타민 C')
    await user.type(screen.getByLabelText('함량 1'), '500')
    await user.type(screen.getByLabelText('비율 1'), '20')
    await user.type(screen.getByLabelText('메모 1'), '산미 조절')
    await user.type(screen.getByLabelText('그룹명'), '신물 억제')
    await user.click(screen.getByRole('button', { name: 'AI 후보 Try 생성' }))

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith('/recommendations/draft-tries', {
        projectName: '신물 억제',
        targetFunction: null,
        dosageForm: '정제',
        constraints: [],
        evidenceContext: [],
        sourceFormula: {
          ingredients: [
            {
              ingredientName: '비타민 C',
              amount: '500',
              unit: 'mg',
              ratio: '20',
              note: '산미 조절',
            },
          ],
        },
      })
    })

    expect(await screen.findByText('AI 추천은 연구 후보 초안입니다.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안정성 우선 후보' })).toBeInTheDocument()
    expect(screen.getByText('고위험 원료 증량 보류')).toBeInTheDocument()
    expect(screen.getByText('일일 섭취량 상한')).toBeInTheDocument()
  })

  it('renders safety and regulatory signals from draft recommendations', async () => {
    const user = userEvent.setup()
    apiPostMock.mockResolvedValueOnce({
      projectName: '신물 억제',
      safetyNotice: 'AI 추천은 연구 후보 초안입니다.',
      safetySignals: [
        {
          type: 'upper-intake-review',
          label: '상한 섭취량 검토',
          severity: 'warning',
          message: '아연 45mg 입력값은 일일 섭취량 상한 검토가 필요합니다.',
          evidenceLevel: 'rule-of-thumb',
          relatedIngredients: ['아연'],
        },
      ],
      candidates: [
        {
          title: '안정성 우선 후보',
          objective: '상한과 독성 가능성을 먼저 확인',
          suggestedChanges: ['고위험 원료 증량 보류'],
          riskChecks: ['일일 섭취량 상한'],
        },
      ],
    })

    renderDashboard()

    await user.type(screen.getByLabelText('원료명 1'), '아연')
    await user.type(screen.getByLabelText('함량 1'), '45')
    await user.click(screen.getByRole('button', { name: 'AI 후보 Try 생성' }))

    expect(await screen.findByRole('heading', { name: '안전/규제 신호' })).toBeInTheDocument()
    expect(screen.getByText('상한 섭취량 검토')).toBeInTheDocument()
    expect(screen.getByText('아연 45mg 입력값은 일일 섭취량 상한 검토가 필요합니다.')).toBeInTheDocument()
    expect(screen.getByText('rule-of-thumb')).toBeInTheDocument()
    expect(screen.getByText('아연')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '상한 섭취량 검토 근거 검색' })).toHaveAttribute(
      'href',
      '/knowledge?q=%EC%95%84%EC%97%B0',
    )
  })

  it('shows local recommendation candidates when the API is unavailable', async () => {
    const user = userEvent.setup()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    renderDashboard()

    await user.type(screen.getByLabelText('원료명 1'), '아연')
    await user.click(screen.getByRole('button', { name: 'AI 후보 Try 생성' }))

    expect(await screen.findByText('API 연결 실패로 로컬 후보 초안을 표시합니다.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안정성 우선 로컬 후보' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안전/규제 신호' })).toBeInTheDocument()
    expect(screen.getByText('상한 섭취량 검토')).toBeInTheDocument()
    expect(screen.getByText('아연')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '상한 섭취량 검토 근거 검색' })).toHaveAttribute(
      'href',
      '/knowledge?q=%EC%95%84%EC%97%B0',
    )
  })
})
