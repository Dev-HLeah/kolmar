import { render, screen } from '@testing-library/react'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { FormulaInputTable, type FormulaRow } from './FormulaInputTable'

describe('FormulaInputTable', () => {
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
})
