import { render, screen, waitFor } from '@testing-library/react'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { FormulaInputTable, type FormulaRow } from './FormulaInputTable'

describe('FormulaInputTable', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds and updates optional formula rows without forcing all values', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    await user.type(screen.getByLabelText('원료명 1'), '비타민 C')
    expect(screen.getByDisplayValue('비타민 C')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '원료 행 추가' }))
    expect(screen.getByLabelText('원료명 2')).toHaveValue('')
  })

  it('opens a voice input draft guide without saving values directly', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    await user.click(screen.getByRole('button', { name: '음성 입력' }))

    const draftPanel = screen.getByRole('region', { name: '음성 입력 초안' })

    expect(draftPanel).toBeInTheDocument()
    expect(
      within(draftPanel).getByText('테아닌 200 밀리그램, 아연 8 밀리그램 추가'),
    ).toBeInTheDocument()
    expect(within(draftPanel).getByText('연구자가 확인한 뒤 배합표에 반영됩니다.')).toBeInTheDocument()
    expect(within(draftPanel).getByRole('columnheader', { name: '원료명' })).toBeInTheDocument()
    expect(within(draftPanel).getByRole('columnheader', { name: '함량' })).toBeInTheDocument()
    expect(within(draftPanel).getByRole('columnheader', { name: '단위' })).toBeInTheDocument()
    expect(within(draftPanel).getByRole('columnheader', { name: '상태' })).toBeInTheDocument()
    expect(screen.getByLabelText('원료명 1')).toHaveValue('')
  })

  it('fills the first empty ingredient row from recent ingredients', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('kolma:recent-ingredients', JSON.stringify(['아연', '비타민 C']))

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    const recentRegion = screen.getByRole('region', { name: '최근 사용 원료' })
    expect(within(recentRegion).getByRole('button', { name: '아연' })).toBeInTheDocument()

    await user.click(within(recentRegion).getByRole('button', { name: '아연' }))

    expect(screen.getByLabelText('원료명 1')).toHaveValue('아연')
  })

  it('stores confirmed ingredient names as recent ingredients', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    await user.type(screen.getByLabelText('원료명 1'), '아연')
    await user.tab()

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('kolma:recent-ingredients') ?? '[]')).toEqual([
        '아연',
      ])
    })
    expect(screen.getByRole('button', { name: '아연' })).toBeInTheDocument()
  })
})
