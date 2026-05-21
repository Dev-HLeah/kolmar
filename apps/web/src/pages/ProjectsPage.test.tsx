import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../api/client'
import { ProjectsPage } from './ProjectsPage'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const apiGetMock = vi.mocked(apiGet)
const apiPostMock = vi.mocked(apiPost)

describe('ProjectsPage', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockRejectedValue(new Error('API offline'))
    apiPostMock.mockReset()
  })

  it('creates a project and initial group without pre-filling tries', async () => {
    const user = userEvent.setup()
    apiPostMock
      .mockResolvedValueOnce({
        id: 'project-api-1',
        name: '위 건강 정제',
        sourceProductId: 'sample-1',
      })
      .mockResolvedValueOnce({
        id: 'group-api-1',
        name: '신물 억제',
        tries: [],
      })

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )

    expect(screen.queryByLabelText('Try 생성 개수')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('프로젝트명'), '위 건강 정제')
    await user.click(screen.getByRole('button', { name: '프로젝트 생성' }))

    expect(apiPostMock).toHaveBeenNthCalledWith(1, '/projects', {
      name: '위 건강 정제',
      goal: null,
      target: null,
      function: null,
      desiredForm: '정제',
      costRange: null,
      excludedIngredients: null,
      sourceProductId: 'sample-1',
      sourceFormulaId: null,
    })
    expect(apiPostMock).toHaveBeenNthCalledWith(2, '/projects/project-api-1/groups', {
      name: '신물 억제',
      purpose: null,
    })
    expect(
      screen.getByRole('row', { name: '위 건강 정제 콜마 고형제 기준 처방 신물 억제 0개' }),
    ).toBeInTheDocument()
  })

  it('loads registered products as source options and sends source formula id', async () => {
    const user = userEvent.setup()
    apiGetMock.mockResolvedValueOnce([
      {
        id: 'product-api-2',
        name: 'API 기준 처방',
        formulas: [{ id: 'formula-api-2' }],
      },
    ])
    apiPostMock
      .mockResolvedValueOnce({
        id: 'project-api-2',
        name: 'API 기반 프로젝트',
        sourceProductId: 'product-api-2',
        sourceFormulaId: 'formula-api-2',
      })
      .mockResolvedValueOnce({
        id: 'group-api-2',
        name: '위 건강',
        tries: [],
      })
      .mockResolvedValueOnce({
        id: 'try-api-1',
        tryNumber: 1,
      })

    render(
      <MemoryRouter initialEntries={['/projects?sourceProductId=product-api-2']}>
        <ProjectsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('option', { name: 'API 기준 처방' })).toBeInTheDocument()
    expect(screen.getByLabelText('기준 제품')).toHaveValue('product-api-2')

    await user.clear(screen.getByLabelText('그룹명'))
    await user.type(screen.getByLabelText('그룹명'), '위 건강')
    await user.type(screen.getByLabelText('프로젝트명'), 'API 기반 프로젝트')
    await user.click(screen.getByRole('button', { name: '프로젝트 생성' }))

    expect(apiPostMock).toHaveBeenNthCalledWith(1, '/projects', {
      name: 'API 기반 프로젝트',
      goal: null,
      target: null,
      function: null,
      desiredForm: '정제',
      costRange: null,
      excludedIngredients: null,
      sourceProductId: 'product-api-2',
      sourceFormulaId: 'formula-api-2',
    })
    expect(apiPostMock).toHaveBeenNthCalledWith(3, '/projects/groups/group-api-2/tries', {
      tryNumber: 1,
      status: 'DRAFT',
      title: '기준 처방',
      memo: 'API 기준 처방에서 복사한 기준 Try입니다.',
      ingredients: [],
    })
    expect(
      screen.getByRole('row', { name: 'API 기반 프로젝트 API 기준 처방 위 건강 1개' }),
    ).toBeInTheDocument()
  })

  it('copies the selected product formula into a baseline try', async () => {
    const user = userEvent.setup()
    apiGetMock.mockResolvedValueOnce([
      {
        id: 'product-api-2',
        name: 'API 기준 처방',
        formulas: [
          {
            id: 'formula-api-2',
            ingredients: [
              {
                amount: '500',
                unit: 'mg',
                ratio: '40',
                role: '산미',
                ingredient: {
                  name: '비타민 C',
                },
              },
            ],
          },
        ],
      },
    ])
    apiPostMock
      .mockResolvedValueOnce({
        id: 'project-api-2',
        name: 'API 기반 프로젝트',
        sourceProductId: 'product-api-2',
        sourceFormulaId: 'formula-api-2',
      })
      .mockResolvedValueOnce({
        id: 'group-api-2',
        name: '위 건강',
        tries: [],
      })
      .mockResolvedValueOnce({
        id: 'try-api-1',
        tryNumber: 1,
      })

    render(
      <MemoryRouter initialEntries={['/projects?sourceProductId=product-api-2']}>
        <ProjectsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('option', { name: 'API 기준 처방' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('그룹명'))
    await user.type(screen.getByLabelText('그룹명'), '위 건강')
    await user.type(screen.getByLabelText('프로젝트명'), 'API 기반 프로젝트')
    await user.click(screen.getByRole('button', { name: '프로젝트 생성' }))

    expect(apiPostMock).toHaveBeenNthCalledWith(3, '/projects/groups/group-api-2/tries', {
      tryNumber: 1,
      status: 'DRAFT',
      title: '기준 처방',
      memo: 'API 기준 처방에서 복사한 기준 Try입니다.',
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
    expect(
      screen.getByRole('row', { name: 'API 기반 프로젝트 API 기준 처방 위 건강 1개' }),
    ).toBeInTheDocument()
  })

  it('keeps a local project draft when the API is unavailable', async () => {
    const user = userEvent.setup()
    apiPostMock.mockRejectedValueOnce(new Error('API offline'))

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('프로젝트명'), '로컬 프로젝트')
    await user.click(screen.getByRole('button', { name: '프로젝트 생성' }))

    expect(
      screen.getByRole('row', { name: '로컬 프로젝트 콜마 고형제 기준 처방 신물 억제 0개' }),
    ).toBeInTheDocument()
    expect(screen.getByText('API 연결 실패로 로컬 화면에만 반영됐습니다.')).toBeInTheDocument()
  })
})
