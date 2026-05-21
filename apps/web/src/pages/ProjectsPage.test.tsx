import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProjectsPage } from './ProjectsPage'

describe('ProjectsPage', () => {
  it('creates a project without pre-filling tries', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )

    expect(screen.queryByLabelText('Try 생성 개수')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('프로젝트명'), '위 건강 정제')
    await user.click(screen.getByRole('button', { name: '프로젝트 생성' }))

    expect(
      screen.getByRole('row', { name: '위 건강 정제 콜마 고형제 기준 처방 신물 억제 0개' }),
    ).toBeInTheDocument()
  })
})
