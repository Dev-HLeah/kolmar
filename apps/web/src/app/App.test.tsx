import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'

describe('App shell', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders research navigation, role controls, and dashboard entry points', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('link', { name: '대시보드' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '제품/처방' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '프로젝트' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '접근 역할' })).toHaveValue('researcher')

    await user.selectOptions(screen.getByRole('combobox', { name: '접근 역할' }), 'viewer')

    expect(screen.getByRole('combobox', { name: '접근 역할' })).toHaveValue('viewer')
    expect(screen.getByRole('heading', { name: '연구 대시보드' })).toBeInTheDocument()
  })
})
