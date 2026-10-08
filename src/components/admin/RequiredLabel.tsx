import type { ReactNode } from 'react'

export function RequiredLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)]">
      {children}{required && <span aria-hidden="true" className="ml-1 text-red-600 dark:text-red-400">*</span>}
    </span>
  )
}
