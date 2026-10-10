'use client'

import { useRef, useState } from 'react'
import { ContentText } from './MarkdownEditor'

type Format = 'heading' | 'bold' | 'italic' | 'link' | 'quote' | 'unordered' | 'ordered' | 'code'
const formats: { format: Format; label: string }[] = [
  { format: 'heading', label: 'Heading' }, { format: 'bold', label: 'Bold' },
  { format: 'italic', label: 'Italic' }, { format: 'link', label: 'Link' },
  { format: 'quote', label: 'Quote' }, { format: 'unordered', label: 'Bullet list' },
  { format: 'ordered', label: 'Numbered list' }, { format: 'code', label: 'Code' },
]

export function BlogMarkdownEditor({ id, value, onChange, disabled }: {
  id: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  const textarea = useRef<HTMLTextAreaElement>(null)
  const selection = useRef({ start: 0, end: 0 })
  const [error, setError] = useState<string | null>(null)

  function formatSelection(format: Format) {
    if (disabled || !textarea.current) return
    let { start, end } = selection.current
    start = Math.min(start, value.length)
    end = Math.min(end, value.length)
    let selected = value.slice(start, end)
    let replacement = ''
    let selectionStart = start
    let selectionEnd = end
    setError(null)

    if (['heading', 'quote', 'unordered', 'ordered'].includes(format)) {
      start = value.lastIndexOf('\n', start - 1) + 1
      const nextLine = value.indexOf('\n', end)
      end = nextLine < 0 ? value.length : nextLine
      selected = value.slice(start, end) || (format === 'heading' ? 'Heading' : 'Text')
      replacement = selected.split('\n').map((line, index) => {
        const prefix = format === 'heading' ? '## ' : format === 'quote' ? '> ' : format === 'ordered' ? `${index + 1}. ` : '- '
        return prefix + line
      }).join('\n')
      selectionStart = start
      selectionEnd = start + replacement.length
    } else {
      selected = selected || (format === 'link' ? 'Link text' : format === 'code' ? 'Code' : 'Text')
      let prefix = format === 'bold' ? '**' : format === 'italic' ? '*' : '`'
      let suffix = prefix
      if (format === 'link') {
        const href = window.prompt('Link destination (https://, http://, mailto:, tel:, /path or #anchor)')
        if (href === null) return
        if (!/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href) || /[\u0000-\u0020\u007f\\()]/.test(href)) {
          setError('Enter a safe link destination without spaces, backslashes or parentheses.')
          return
        }
        selected = selected.replace(/[\[\]\n]/g, '')
        prefix = '['
        suffix = `](${href})`
      } else if (format === 'code' && selected.includes('\n')) {
        prefix = `${start > 0 && value[start - 1] !== '\n' ? '\n' : ''}\n\`\`\`\n`
        suffix = '\n```\n\n'
      }
      replacement = prefix + selected + suffix
      selectionStart = start + prefix.length
      selectionEnd = selectionStart + selected.length
    }

    const nextValue = value.slice(0, start) + replacement + value.slice(end)
    if (nextValue.length > 50000) {
      setError('Formatting would exceed the 50,000 character body limit.')
      return
    }
    onChange(nextValue)
    selection.current = { start: selectionStart, end: selectionEnd }
    requestAnimationFrame(() => {
      textarea.current?.focus()
      textarea.current?.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <div className="min-w-0">
        <label htmlFor={id} className="admin-section mb-3 block">Body · Markdown</label>
        <div role="toolbar" aria-label="Markdown formatting" className="mb-3 flex flex-wrap gap-1 border-b border-[var(--border)] pb-3">
          {formats.map(({ format, label }) => (
            <button key={format} type="button" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection(format)} className="border border-[var(--border)] px-2.5 py-2 text-[11px] text-[var(--fg)] transition-colors hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40">{label}</button>
          ))}
        </div>
        <textarea ref={textarea} id={id} value={value} onChange={(event) => onChange(event.target.value)} onSelect={(event) => { selection.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd } }} disabled={disabled} maxLength={50000} rows={18} className="admin-input resize-y font-mono" aria-describedby={`${id}-hint`} />
        <p id={`${id}-hint`} className="mt-2 text-xs text-[var(--fg-muted)]">Select text to format. Markdown only; raw HTML is never executed. {value.length.toLocaleString('en-US')} / 50,000</p>
        {error && <p role="alert" className="admin-status-red mt-3">{error}</p>}
      </div>
      <section aria-label="Live body preview" className="min-w-0">
        <h3 className="admin-section mb-3">Live preview</h3>
        <div className="min-h-64 border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6">
          {value.trim() ? <ContentText content={value} /> : <p className="font-serif text-lg text-[var(--fg-muted)]">Your story will appear here as you write.</p>}
        </div>
      </section>
    </div>
  )
}
