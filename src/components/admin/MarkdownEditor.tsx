import { Fragment, type ReactNode } from 'react'

export const CONTENT_PAGES = [
  { key: 'about', path: 'about', label: 'About' },
  { key: 'contacts', path: 'contacts', label: 'Contacts' },
  { key: 'legal_offer', path: 'legal/offer', label: 'Public Offer' },
  { key: 'legal_privacy', path: 'legal/privacy', label: 'Privacy Policy' },
] as const

export interface LocalizedContent {
  title_ru?: string | null
  title_en?: string | null
  title_de?: string | null
  content_ru?: string | null
  content_en?: string | null
  content_de?: string | null
}

export interface ContentItem extends LocalizedContent {
  id: string | null
  page_key: typeof CONTENT_PAGES[number]['key']
  metadata: Record<string, unknown>
  updated_at?: string
  updated_by?: string | null
}

export function localizedContent(item: LocalizedContent | null, locale: string, field: 'title' | 'content') {
  if (!item) return ''
  const values = field === 'title'
    ? { ru: item.title_ru, en: item.title_en, de: item.title_de }
    : { ru: item.content_ru, en: item.content_en, de: item.content_de }
  const current = locale === 'ru' ? values.ru : locale === 'de' ? values.de : values.en
  return [current, values.en, values.ru, values.de].find((value) => value?.trim()) ?? ''
}

export function contentPlaceholder(locale: string) {
  return locale === 'ru'
    ? 'Содержимое этой страницы пока не опубликовано.'
    : locale === 'de'
      ? 'Der Inhalt dieser Seite wurde noch nicht veröffentlicht.'
      : 'Content for this page has not been published yet.'
}

function inlineMarkdown(text: string): ReactNode[] {
  const tokens = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|!?\[[^\]\n]*\]\([^\s)]+\))/g
  const nodes: ReactNode[] = []
  let offset = 0
  for (const match of text.matchAll(tokens)) {
    nodes.push(text.slice(offset, match.index))
    const token = match[0]
    let node: ReactNode = token
    if (token.startsWith('`')) node = <code className="rounded bg-primary/10 px-1 font-mono">{token.slice(1, -1)}</code>
    else if (token.startsWith('**') || token.startsWith('__')) node = <strong>{token.slice(2, -2)}</strong>
    else if (token.startsWith('*') || token.startsWith('_')) node = <em>{token.slice(1, -1)}</em>
    else if (!token.startsWith('!')) {
      const link = /^\[([^\]]*)\]\(([^)]+)\)$/.exec(token)
      if (link && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(link[2]) && !/[\u0000-\u0020\u007f\\]/.test(link[2])) {
        node = <a href={link[2]} className="underline underline-offset-4" rel="noopener noreferrer">{link[1]}</a>
      }
    }
    nodes.push(<Fragment key={match.index}>{node}</Fragment>)
    offset = match.index! + token.length
  }
  nodes.push(text.slice(offset))
  return nodes
}

export function ContentText({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0
  const startsBlock = (line: string) => /^(#{1,6}\s|\s*```|>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+|\s*(?:-{3,}|\*{3,}|_{3,})\s*$)/.test(line)

  while (index < lines.length) {
    const line = lines[index]
    const key = index
    if (!line.trim()) { index++; continue }
    if (/^\s*```/.test(line)) {
      const code: string[] = []
      index++
      while (index < lines.length && !/^\s*```/.test(lines[index])) code.push(lines[index++])
      if (index < lines.length) index++
      blocks.push(<pre key={key} className="overflow-x-auto rounded bg-primary/10 p-4"><code>{code.join('\n')}</code></pre>)
      continue
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line)
    if (heading) {
      const Tag = `h${heading[1].length}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      blocks.push(<Tag key={key} className="font-serif text-xl font-semibold">{inlineMarkdown(heading[2])}</Tag>)
      index++
      continue
    }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key} className="border-primary/20" />)
      index++
      continue
    }
    const list = /^(\s*[-*+]\s+|\s*\d+[.)]\s+)(.*)$/.exec(line)
    if (list) {
      const ordered = /^\s*\d/.test(line)
      const pattern = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/
      const items: ReactNode[] = []
      while (index < lines.length) {
        const item = pattern.exec(lines[index])
        if (!item) break
        items.push(<li key={index++}>{inlineMarkdown(item[1])}</li>)
      }
      blocks.push(ordered
        ? <ol key={key} start={Number.parseInt(line.trim(), 10)} className="list-decimal space-y-2 pl-6">{items}</ol>
        : <ul key={key} className="list-disc space-y-2 pl-6">{items}</ul>)
      continue
    }
    if (/^>/.test(line)) {
      const quote: string[] = []
      while (index < lines.length && /^>/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''))
      blocks.push(<blockquote key={key} className="whitespace-pre-wrap border-l-2 border-primary/30 pl-4">{inlineMarkdown(quote.join('\n'))}</blockquote>)
      continue
    }
    const paragraph = [line]
    index++
    while (index < lines.length && lines[index].trim() && !startsBlock(lines[index])) paragraph.push(lines[index++])
    blocks.push(<p key={key} className="whitespace-pre-wrap">{inlineMarkdown(paragraph.join('\n'))}</p>)
  }

  return <div className="space-y-5 break-words text-sm leading-relaxed">{blocks}</div>
}

export function MarkdownEditor({ id, value, onChange, disabled }: {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)]">
        Body
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        maxLength={50000}
        rows={16}
        className="admin-input resize-y"
      />
      <p className="mt-2 text-xs text-[var(--fg-muted)]">Markdown supports headings, lists, links, emphasis and code. Raw HTML is never executed.</p>
    </div>
  )
}
