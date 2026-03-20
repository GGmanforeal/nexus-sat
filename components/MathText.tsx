'use client'
// components/MathText.tsx — renders text, strips lone $ signs (not math)
import { useEffect, useRef } from 'react'

let katexState: 'idle' | 'loading' | 'ready' = 'idle'
const katexQueue: Array<() => void> = []

function loadKaTeX(cb: () => void) {
  if (katexState === 'ready') { cb(); return }
  katexQueue.push(cb)
  if (katexState === 'loading') return
  katexState = 'loading'

  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
  css.crossOrigin = 'anonymous'
  document.head.appendChild(css)

  const s1 = document.createElement('script')
  s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'
  s1.crossOrigin = 'anonymous'
  s1.defer = true
  s1.onload = () => {
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
    katexState = 'ready'
    katexQueue.splice(0).forEach(f => f())
  }
  document.head.appendChild(s1)
}

// Detect whether text actually contains math expressions
// Returns true only if $..$ / $$..$$  / \(...\) / \[..\]  patterns exist
function hasMath(text: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/.test(text)
}

// Strip lone $ signs that are NOT part of math (e.g. currency symbols)
function cleanDollarSigns(text: string): string {
  // Replace $ that is NOT followed by a non-space character (i.e. currency $50)
  // Keep $x$ math pairs intact, remove standalone currency $ symbols
  // Strategy: replace $ that is followed by space, digit without closing $, or end
  return text.replace(/\$(?!\S[^$]*\$)/g, '')
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

    const displayText = cleanDollarSigns(text)
    el.textContent = displayText

    if (!hasMath(text)) return  // skip KaTeX loading for non-math text

    loadKaTeX(() => {
      const el2 = ref.current
      if (!el2) return
      el2.textContent = displayText
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

  return <div ref={ref} style={style} className={className}>{cleanDollarSigns(text)}</div>
}
