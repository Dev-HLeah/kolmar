import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiPost } from '../api/client'
import { DashboardPage } from './DashboardPage'

vi.mock('../api/client', () => ({
  apiPost: vi.fn(),
}))

const apiPostMock = vi.mocked(apiPost)

describe('DashboardPage', () => {
  beforeEach(() => {
    apiPostMock.mockReset()
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

    render(<DashboardPage />)

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

  it('shows local recommendation candidates when the API is unavailable', async () => {
    const user = userEvent.setup()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    render(<DashboardPage />)

    await user.type(screen.getByLabelText('원료명 1'), '아연')
    await user.click(screen.getByRole('button', { name: 'AI 후보 Try 생성' }))

    expect(await screen.findByText('API 연결 실패로 로컬 후보 초안을 표시합니다.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '안정성 우선 로컬 후보' })).toBeInTheDocument()
    expect(screen.getByText('아연')).toBeInTheDocument()
  })
})
