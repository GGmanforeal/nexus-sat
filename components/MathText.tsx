'use client'
// components/MathText.tsx — robust KaTeX renderer with proper fallback
import { useEffect, useRef } from 'react'

// Global KaTeX loader — loads once, runs queued callbacks
let katexState: 'idle' | 'loading' | 'ready' = 'idle'
const katexQueue: Array<() => void> = []

function loadKaTeX(cb: () => void) {
  if (katexState === 'ready') { cb(); return }
  katexQueue.push(cb)
  if (katexState === 'loading') return
  katexState = 'loading'

  // CSS
  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
  css.crossOrigin = 'anonymous'
  document.head.appendChild(css)

  // KaTeX core
  const s1 = document.createElement('script')
  s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'
  s1.crossOrigin = 'anonymous'
  s1.defer = true
  s1.onload = () => {
    // auto-render
    const s2 = document.createElement('script')
    s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js'
    s2.crossOrigin = 'anonymous'
    s2.defer = true
    s2.onload = () => {
      katexState = 'ready'
      katexQueue.splice(0).forEach(f => f())
    }
    document.head.appendChild(s2)
  }
  s1.onerror = () => {
    // KaTeX failed to load (e.g. CSP) — mark ready anyway so text still shows
    katexState = 'ready'
    katexQueue.splice(0).forEach(f => f())
  }
  document.head.appendChild(s1)
}

const DELIMITERS = [
  { left: '$$', right: '$$', display: true  },
  { left: '$',  right: '$',  display: false },
  { left: '\\(', right: '\\)', display: false },
  { left: '\\[', right: '\\]', display: true  },
]

interface Props {
  text: string
  style?: React.CSSProperties
  className?: string
}

export function MathText({ text, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Set raw text immediately so content shows even before KaTeX loads
    el.textContent = text

    loadKaTeX(() => {
      const el2 = ref.current
      if (!el2) return
      el2.textContent = text
      try {
        ;(window as any).renderMathInElement?.(el2, {
          delimiters: DELIMITERS,
          throwOnError: false,
          errorColor: '#f87171',
          strict: false,
        })
      } catch { /* leave as plain text */ }
    })
  }, [text])

  return <div ref={ref} style={style} className={className}>{text}</div>
}
