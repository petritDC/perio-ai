'use client'

import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Native <select>-based implementation matching the shadcn/ui API surface.
// SelectTrigger / SelectValue are no-ops; SelectContent renders the <select>.
// ---------------------------------------------------------------------------

interface SelectCtx {
  name?: string
  value: string
  onChange: (v: string) => void
}

const SelectCtx = createContext<SelectCtx>({ value: '', onChange: () => {} })

function Select({
  name,
  defaultValue = '',
  value: controlled,
  onValueChange,
  children,
}: {
  name?: string
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  children?: React.ReactNode
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = controlled ?? uncontrolled
  const onChange = (v: string) => {
    setUncontrolled(v)
    onValueChange?.(v)
  }
  return (
    <SelectCtx.Provider value={{ name, value, onChange }}>
      {children}
    </SelectCtx.Provider>
  )
}

// Trigger and Value are structural; the real input is rendered by SelectContent
function SelectTrigger({ children, className }: { children?: React.ReactNode; className?: string }) {
  return null
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  return null
}

function SelectContent({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const { name, value, onChange } = useContext(SelectCtx)
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full h-9 rounded-lg border border-[#E4E7EE] bg-white text-slate-800 text-[13px] px-3',
        'outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors',
        className
      )}
    >
      {children}
    </select>
  )
}

function SelectItem({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return <option value={value} className={className}>{children}</option>
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
