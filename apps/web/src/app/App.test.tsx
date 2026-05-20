import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App shell', () => {
  it('renders research navigation and dashboard entry points', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: '대시보드' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '제품/처방' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '프로젝트' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '연구 대시보드' })).toBeInTheDocument()
  })
})
