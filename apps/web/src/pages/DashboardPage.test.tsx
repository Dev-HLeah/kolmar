import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../api/client'
import { DashboardPage } from './DashboardPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)

describe('DashboardPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockResolvedValue([])
  })

  function renderDashboard() {
    return render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
  }

  it('shows total and weekly dashboard metrics only', async () => {
    apiGetMock.mockImplementation(async (path) => {
      if (path === '/products') {
        return [
          {
            id: 'product-1',
            name: '콜마 고형제 기준 처방',
            function: '위 건강',
            createdAt: '2026-05-25T01:00:00.000Z',
            dosageForm: { name: '츄어블 정제' },
            formulas: [{ ingredients: [{ id: 'ingredient-1' }, { id: 'ingredient-2' }] }],
          },
          {
            id: 'product-2',
            name: '수면 밸런스 정제',
            function: '수면 건강',
            createdAt: '2026-05-18T01:00:00.000Z',
            dosageForm: { name: '정제' },
            formulas: [{ ingredients: [{ id: 'ingredient-3' }] }],
          },
        ]
      }

      if (path === '/projects') {
        return [
          {
            id: 'project-1',
            name: '신물 억제 고형제 개발',
            createdAt: '2026-05-26T01:00:00.000Z',
            groups: [
              {
                name: '안정성 개선',
                tries: [
                  {
                    id: 'try-1',
                    tryNumber: 1,
                    title: '기준 처방',
                    status: 'PLANNED',
                    createdAt: '2026-05-26T01:00:00.000Z',
                    marks: [{ id: 'mark-1' }],
                  },
                  {
                    id: 'try-2',
                    tryNumber: 2,
                    title: '감미 조정',
                    status: 'TESTED',
                    createdAt: '2026-05-19T01:00:00.000Z',
                    marks: [],
                  },
                ],
              },
            ],
          },
          {
            id: 'project-2',
            name: '눈 건강 정제 개발',
            createdAt: '2026-05-10T01:00:00.000Z',
            groups: [
              {
                name: '기준 처방',
                tries: [
                  {
                    id: 'try-3',
                    tryNumber: 1,
                    title: '루테인 기준',
                    status: 'DRAFT',
                    createdAt: '2026-05-25T01:00:00.000Z',
                    marks: [],
                  },
                ],
              },
            ],
          },
        ]
      }

      return []
    })

    renderDashboard()

    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument()
    expect(screen.getByText('이번 주 2026.05.25 - 2026.05.31')).toBeInTheDocument()

    const productMetric = screen.getByRole('article', { name: '등록 제품 전체 2 이번 주 1' })
    expect(within(productMetric).getByText('등록 제품')).toBeInTheDocument()
    expect(within(productMetric).getByText('2')).toBeInTheDocument()
    expect(within(productMetric).getByText('이번 주 1')).toBeInTheDocument()

    const projectMetric = screen.getByRole('article', { name: '진행 프로젝트 전체 2 이번 주 1' })
    expect(within(projectMetric).getByText('진행 프로젝트')).toBeInTheDocument()
    expect(within(projectMetric).getByText('2')).toBeInTheDocument()
    expect(within(projectMetric).getByText('이번 주 1')).toBeInTheDocument()

    const plannedTryMetric = screen.getByRole('article', { name: '계획 Try 전체 2 이번 주 2' })
    expect(within(plannedTryMetric).getByText('계획 Try')).toBeInTheDocument()
    expect(within(plannedTryMetric).getByText('2')).toBeInTheDocument()
    expect(within(plannedTryMetric).getByText('이번 주 2')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: '최근 등록 제품' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '콜마 고형제 기준 처방' })).toHaveAttribute(
      'href',
      '/products/product-1',
    )
    expect(screen.getByRole('heading', { name: '최근 생성 프로젝트' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '신물 억제 고형제 개발' })[0]).toHaveAttribute(
      'href',
      '/projects/project-1',
    )
    expect(screen.getByRole('heading', { name: '이번 주 계획 Try' })).toBeInTheDocument()
    expect(screen.getByText('try#1 기준 처방')).toBeInTheDocument()
    expect(screen.getByText('try#1 루테인 기준')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '의미 있는 Try' })).toBeInTheDocument()
    expect(screen.getByText('1건')).toBeInTheDocument()

    expect(screen.queryByText('AI 후보 Try 생성')).not.toBeInTheDocument()
    expect(screen.queryByText('제품 등록')).not.toBeInTheDocument()
  })
})
