import { useEffect, useRef, useState } from 'react'
import './CustomSelect.css'

export type SelectOption = {
  value: string
  label: string
}

type Props = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function CustomSelect({ value, options, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  useEffect(() => {
    if (!isOpen) return

    function handleOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  return (
    <div ref={wrapRef} className={`custom-select${isOpen ? ' open' : ''}`}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-value">{selectedLabel}</span>
        <span className="custom-select-caret" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              className={`custom-select-option${opt.value === value ? ' selected' : ''}`}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span className="custom-select-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
