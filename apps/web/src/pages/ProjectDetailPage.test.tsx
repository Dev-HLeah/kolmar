import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ProjectDetailPage } from './ProjectDetailPage'

describe('ProjectDetailPage', () => {
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
    render(<ProjectDetailPage />)

    await user.type(screen.getByLabelText('Try 목적'), '붕해 시간 개선 후보')
    await user.click(screen.getByRole('button', { name: 'Try 추가' }))

    expect(
      screen.getByRole('row', {
        name: 'try#7 붕해 시간 개선 후보 일반 try#7 마킹 try#7 삭제',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('try#1-7')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'try#7 삭제' }))

    expect(screen.queryByText('붕해 시간 개선 후보')).not.toBeInTheDocument()
    expect(screen.getByText('try#1-6')).toBeInTheDocument()
  })
})
