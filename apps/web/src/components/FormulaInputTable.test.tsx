import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('pastes spreadsheet rows into formula inputs and recent ingredients', async () => {
    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    fireEvent.paste(screen.getByLabelText('원료명 1'), {
      clipboardData: {
        getData: () => '비타민 C\t500\tmg\t20\t산미 조절\n아연\t8\tmg\t1\t상한 확인',
      },
    })

    expect(screen.getByLabelText('원료명 1')).toHaveValue('비타민 C')
    expect(screen.getByLabelText('함량 1')).toHaveValue('500')
    expect(screen.getByLabelText('단위 1')).toHaveValue('mg')
    expect(screen.getByLabelText('비율 1')).toHaveValue('20')
    expect(screen.getByLabelText('메모 1')).toHaveValue('산미 조절')

    expect(screen.getByLabelText('원료명 2')).toHaveValue('아연')
    expect(screen.getByLabelText('함량 2')).toHaveValue('8')
    expect(screen.getByLabelText('단위 2')).toHaveValue('mg')
    expect(screen.getByLabelText('비율 2')).toHaveValue('1')
    expect(screen.getByLabelText('메모 2')).toHaveValue('상한 확인')

    const recentRegion = screen.getByRole('region', { name: '최근 사용 원료' })
    expect(within(recentRegion).getByRole('button', { name: '비타민 C' })).toBeInTheDocument()
    expect(within(recentRegion).getByRole('button', { name: '아연' })).toBeInTheDocument()
  })

  it('converts amount units between grams and milligrams', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    expect(screen.getByRole('button', { name: '1행 mg로 변환' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '1행 g로 변환' })).toBeDisabled()

    await user.type(screen.getByLabelText('함량 1'), '1.5')
    await user.selectOptions(screen.getByLabelText('단위 1'), 'g')
    await user.click(screen.getByRole('button', { name: '1행 mg로 변환' }))

    expect(screen.getByLabelText('함량 1')).toHaveValue('1500')
    expect(screen.getByLabelText('단위 1')).toHaveValue('mg')

    await user.click(screen.getByRole('button', { name: '1행 g로 변환' }))

    expect(screen.getByLabelText('함량 1')).toHaveValue('1.5')
    expect(screen.getByLabelText('단위 1')).toHaveValue('g')
  })

  it('suggests matching ingredients and fills the selected suggestion', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    await user.type(screen.getByLabelText('원료명 1'), '비타')

    const suggestions = screen.getByRole('region', { name: '원료 자동완성 1' })
    expect(within(suggestions).getByRole('button', { name: '비타민 C' })).toBeInTheDocument()

    await user.click(within(suggestions).getByRole('button', { name: '비타민 C' }))

    expect(screen.getByLabelText('원료명 1')).toHaveValue('비타민 C')
    expect(screen.queryByRole('region', { name: '원료 자동완성 1' })).not.toBeInTheDocument()
  })

  it('summarizes formula totals and warns when the ratio exceeds 100 percent', () => {
    render(
      <FormulaInputTable
        rows={[
          { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '60', note: '' },
          { ingredientName: '아연', amount: '1000', unit: 'mg', ratio: '45', note: '' },
        ]}
        onChange={() => undefined}
      />,
    )

    const summary = screen.getByRole('region', { name: '배합 합계' })

    expect(within(summary).getByText('입력 원료 2개')).toBeInTheDocument()
    expect(within(summary).getByText('함량 합계 1,500 mg')).toBeInTheDocument()
    expect(within(summary).getByText('비율 합계 105%')).toBeInTheDocument()
    expect(within(summary).getByText('비율 합계가 100%를 초과했습니다.')).toBeInTheDocument()
  })

  it('does not count an empty row as an entered ingredient', () => {
    render(
      <FormulaInputTable
        rows={[{ ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' }]}
        onChange={() => undefined}
      />,
    )

    const summary = screen.getByRole('region', { name: '배합 합계' })

    expect(within(summary).getByText('입력 원료 0개')).toBeInTheDocument()
    expect(within(summary).getByText('함량 합계 0')).toBeInTheDocument()
    expect(within(summary).getByText('비율 합계 0%')).toBeInTheDocument()
  })

  it('calculates ratios from same-unit amounts', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '', note: '' },
        { ingredientName: '아연', amount: '1000', unit: 'mg', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    await user.click(screen.getByRole('button', { name: '함량 기준 비율 계산' }))

    expect(screen.getByLabelText('비율 1')).toHaveValue('33.333333')
    expect(screen.getByLabelText('비율 2')).toHaveValue('66.666667')
    expect(screen.getByText('비율 합계 100%')).toBeInTheDocument()
  })

  it('explains that ratio calculation needs amounts', () => {
    render(
      <FormulaInputTable
        rows={[{ ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' }]}
        onChange={() => undefined}
      />,
    )

    const summary = screen.getByRole('region', { name: '배합 합계' })

    expect(within(summary).getByRole('button', { name: '함량 기준 비율 계산' })).toBeDisabled()
    expect(within(summary).getByText('함량을 입력하면 비율을 계산할 수 있습니다.')).toBeInTheDocument()
  })

  it('explains that ratio calculation needs one amount unit', () => {
    render(
      <FormulaInputTable
        rows={[
          { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '', note: '' },
          { ingredientName: '아연', amount: '1', unit: 'g', ratio: '', note: '' },
        ]}
        onChange={() => undefined}
      />,
    )

    const summary = screen.getByRole('region', { name: '배합 합계' })

    expect(within(summary).getByRole('button', { name: '함량 기준 비율 계산' })).toBeDisabled()
    expect(within(summary).getByText('단위가 섞여 있어 비율 계산 전 단위 통일이 필요합니다.')).toBeInTheDocument()
  })

  it('normalizes mixed gram and milligram amounts to milligrams', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '', note: '' },
        { ingredientName: '아연', amount: '1', unit: 'g', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'mg로 전체 통일' }))

    expect(screen.getByLabelText('함량 1')).toHaveValue('500')
    expect(screen.getByLabelText('단위 1')).toHaveValue('mg')
    expect(screen.getByLabelText('함량 2')).toHaveValue('1000')
    expect(screen.getByLabelText('단위 2')).toHaveValue('mg')
    expect(screen.getByText('함량 합계 1,500 mg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '함량 기준 비율 계산' })).toBeEnabled()
  })

  it('normalizes mixed gram and milligram amounts to grams', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [rows, setRows] = useState<FormulaRow[]>([
        { ingredientName: '비타민 C', amount: '500', unit: 'mg', ratio: '', note: '' },
        { ingredientName: '아연', amount: '1', unit: 'g', ratio: '', note: '' },
      ])

      return <FormulaInputTable rows={rows} onChange={setRows} />
    }

    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'g로 전체 통일' }))

    expect(screen.getByLabelText('함량 1')).toHaveValue('0.5')
    expect(screen.getByLabelText('단위 1')).toHaveValue('g')
    expect(screen.getByLabelText('함량 2')).toHaveValue('1')
    expect(screen.getByLabelText('단위 2')).toHaveValue('g')
    expect(screen.getByText('함량 합계 1.5 g')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '함량 기준 비율 계산' })).toBeEnabled()
  })
})
