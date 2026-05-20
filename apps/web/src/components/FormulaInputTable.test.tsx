import { render, screen } from '@testing-library/react'
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
})
