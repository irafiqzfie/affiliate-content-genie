"use client"

import { useEffect, useState } from 'react'

export default function BodyAttrDebugger() {
  const [val, setVal] = useState<string | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    const read = () => {
      const v = body.getAttribute('ap-style')
      setVal(v)
      console.log('[BodyAttrDebugger] ap-style:', v)
    }

    read()

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName) {
          const v = body.getAttribute('ap-style')
          setVal(v)
          console.log('[BodyAttrDebugger] mutation:', m.attributeName, '->', v)
        }
      }
    })

    mo.observe(body, { attributes: true })
    return () => mo.disconnect()
  }, [])

  return (
    <div style={{ fontSize: 11, opacity: 0.8 }} title="Body attribute debugger">
      ap-style: {String(val)}
    </div>
  )
}
