import React, { useCallback, useMemo, useRef, useState } from 'react'

export type Segment = {
  label: string
  cssFilter?: string
  custom?: React.ReactNode
}

export type MultiCompareSliderProps = {
  src: string
  alt: string
  segments: Segment[]
  initialPositions?: number[]
  minHandleGapPx?: number
  height?: number
  showLegend?: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export default function MultiCompareSlider({
  src,
  alt,
  segments,
  initialPositions,
  minHandleGapPx = 24,
  height = 420,
  showLegend = true,
}: MultiCompareSliderProps) {
  if (segments.length < 2) throw new Error('Provide at least 2 segments to compare.')
  const handleCount = segments.length - 1

  const defaultPositions = useMemo(
    () => Array.from({ length: handleCount }, (_, i) => Math.round(((i + 1) / segments.length) * 100)),
    [handleCount, segments.length]
  )

  const [positions, setPositions] = useState<number[]>(
    initialPositions && initialPositions.length === handleCount ? [...initialPositions] : defaultPositions
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeHandleRef = useRef<number | null>(null)

  const pxToPct = useCallback((px: number) => {
    const el = containerRef.current
    if (!el) return 0
    const w = el.clientWidth
    return (px / w) * 100
  }, [])

  const reposition = useCallback(
    (index: number, newPct: number) => {
      const el = containerRef.current
      if (!el) return
      const w = el.clientWidth
      const gapPct = (minHandleGapPx / w) * 100

      setPositions(prev => {
        const next = [...prev]
        const leftBound = index === 0 ? 0 : prev[index - 1] + gapPct
        const rightBound = index === prev.length - 1 ? 100 : prev[index + 1] - gapPct
        next[index] = clamp(newPct, leftBound, rightBound)
        return next
      })
    },
    [minHandleGapPx]
  )

  const onPointerDown = (i: number) => (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    activeHandleRef.current = i
  }
  const onPointerUp = () => { activeHandleRef.current = null }
  const onPointerMove = (e: React.PointerEvent) => {
    const i = activeHandleRef.current
    if (i === null) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    reposition(i, pxToPct(px))
  }

  const onKeyDown = (i: number) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const delta = e.key === 'ArrowLeft' ? -step : step
      reposition(i, positions[i] + delta)
    }
  }

  const segmentsWithClips = useMemo(() => {
    const cuts = [0, ...positions, 100]
    return cuts.slice(0, -1).map((startPct, i) => {
      const endPct = cuts[i + 1]
      const clip = `polygon(${startPct}% 0, ${endPct}% 0, ${endPct}% 100%, ${startPct}% 100%)`
      return { ...segments[i], clip }
    })
  }, [positions, segments])

  return (
    <div style={{ height, userSelect: 'none' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 16,
          border: '1px solid #d4d4d4',
          background: '#f3f4f6',
          boxSizing: 'border-box'
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {segmentsWithClips.map((seg, idx) => (
          <div
            key={idx}
            aria-label={seg.label}
            role="img"
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: seg.clip as any,
            }}
          >
            {seg.custom ? seg.custom : (
              <img
                src={src}
                alt={alt}
                draggable={false}
                style={{ height: '100%', width: '100%', objectFit: 'cover', filter: seg.cssFilter || 'none' }}
              />
            )}
          </div>
        ))}

        {positions.map((pct, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Split handle ${i + 1} at ${Math.round(pct)} percent`}
            onPointerDown={onPointerDown(i)}
            onKeyDown={onKeyDown(i)}
            style={{
              position: 'absolute',
              top: 0,
              left: `${pct}%`,
              height: '100%',
              transform: 'translateX(-50%)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'ew-resize'
            }}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 999,
                padding: 6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
              }}>
                <div style={{
                  width: 4, height: 18, background: '#111', borderRadius: 2,
                  boxShadow: '6px 0 0 #111, -6px 0 0 #111'
                }} />
              </div>
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0, left: '50%',
                width: 2, background: 'rgba(0,0,0,0.25)',
                transform: 'translateX(-1px)'
              }} />
            </div>
          </button>
        ))}
      </div>

      {showLegend && (
        <div className="legend">
          {segments.map((s, i) => (
            <span key={i} className="chip">
              <span className="dot" style={{ background: `hsl(${(i * 137.508) % 360} 70% 55%)` }}></span>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
