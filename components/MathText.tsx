'use client'
// components/MathText.tsx
import { useEffect, useRef, useState } from 'react'

let katexState: 'idle' | 'loading' | 'ready' = 'idle'
const katexQueue: Array<() => void> = []

function whenKaTeXReady(fn: () => void) {
  if (katexState === 'ready') { fn(); return }
  katexQueue.push(fn)
  if (katexState === 'loading') return
  katexState = 'loading'

  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
  css.crossOrigin = 'anonymous'
  document.head.appendChild(css)

  const s1 = document.createElement('script')
  s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
  s1.crossOrigin = 'anonymous'
  s1.onload = () => {
    const s2 = document.createElement('script')
    s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
    s2.crossOrigin = 'anonymous'
    s2.onload = () => {
      katexState = 'ready'
      katexQueue.forEach(f => f())
      katexQueue.length = 0
    }
    document.head.appendChild(s2)
  }
  document.head.appendChild(s1)
}

interface Props {
  text: string
  style?: React.CSSProperties
  className?: string
}

export function MathText({ text, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => { whenKaTeXReady(() => setReady(true)) }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !ready || !text) return
    el.textContent = text
    try {
      ;(window as any).renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
        errorColor: '#f87171',
      })
    } catch { /* show raw text on error */ }
  }, [text, ready])

  return (
    <div ref={ref} style={style} className={className}>
      {text}
    </div>
  )
}