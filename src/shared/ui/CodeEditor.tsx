import { useMemo, useRef } from 'react'
import { highlighter } from './highlight'

type Props = {
  value: string
  onChange: (v: string) => void
  lang: 'json' | 'markdown'
  rows?: number
  placeholder?: string
}

// editable textarea over a highlighted <pre>: the textarea keeps the text transparent, the pre paints it
export function CodeEditor({ value, onChange, lang, rows = 8, placeholder }: Props) {
  const layer = useRef<HTMLDivElement>(null)
  // trailing newline keeps the last empty line the same height in both layers
  const html = useMemo(() => highlighter.highlight(value + '\n', { lang }).html, [value, lang])

  return (
    <div className="code">
      <div className="code-hl" aria-hidden ref={layer}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <textarea
        rows={rows}
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (layer.current) layer.current.scrollTop = e.currentTarget.scrollTop
        }}
      />
    </div>
  )
}
