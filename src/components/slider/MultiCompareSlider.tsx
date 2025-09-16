// components/slider/MultiCompareSlider.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  cloneElement,
  isValidElement,
} from "react";

export type Segment = { label: string; custom?: React.ReactNode };

const HANDLE_SIZE = 44;
const MIN_GAP = 2;

export default function MultiCompareSlider({
  background,
  segments,
  initialPositions,
  height = 460,
  showLegend = true,
  showSliceLabels = true,
}: {
  background: React.ReactNode;
  segments: Segment[];
  initialPositions?: number[];
  height?: number;
  showLegend?: boolean;
  showSliceLabels?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [c, setC] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = containerRef.current!;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setC({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const segs = useMemo(
    () => (segments.length >= 2 ? segments : [{ label: "A" }, { label: "B" }]),
    [segments]
  );
  const handleCount = segs.length - 1;
  const even = useMemo(
    () =>
      Array.from(
        { length: handleCount },
        (_, i) => ((i + 1) / segs.length) * 100
      ),
    [handleCount, segs.length]
  );

  const seeded = useMemo(() => {
    const src = (initialPositions?.slice(0, handleCount) ?? even).map((p) =>
      Math.max(0, Math.min(100, p))
    );
    for (let i = 0; i < src.length; i++)
      src[i] = Math.max(i === 0 ? MIN_GAP : src[i - 1] + MIN_GAP, src[i]);
    if (src.length)
      src[src.length - 1] = Math.min(100 - MIN_GAP, src[src.length - 1]);
    return src;
  }, [initialPositions, handleCount, even]);

  const [pos, setPos] = useState<number[]>(seeded);
  useEffect(() => {
    setPos(even);
  }, [even.join("|")]);

  const dragIdx = useRef<number | null>(null);
  const pxToPct = useCallback((x: number) => {
    const r = containerRef.current!.getBoundingClientRect();
    return ((Math.max(r.left, Math.min(x, r.right)) - r.left) / r.width) * 100;
  }, []);
  const clamp = useCallback(
    (pct: number, idx: number) => {
      const min = idx === 0 ? MIN_GAP : pos[idx - 1] + MIN_GAP;
      const max =
        idx === pos.length - 1 ? 100 - MIN_GAP : pos[idx + 1] - MIN_GAP;
      return Math.max(min, Math.min(max, pct));
    },
    [pos]
  );
  const onMove = useCallback(
    (e: PointerEvent) => {
      if (dragIdx.current == null) return;
      const i = dragIdx.current;
      setPos((p) => {
        const n = [...p];
        n[i] = clamp(pxToPct(e.clientX), i);
        return n;
      });
      e.preventDefault();
    },
    [clamp, pxToPct]
  );
  const end = useCallback(() => {
    dragIdx.current = null;
    window.removeEventListener("pointermove", onMove as any);
    window.removeEventListener("pointerup", end as any);
  }, [onMove]);
  const start = (i: number) => (e: React.PointerEvent) => {
    dragIdx.current = i;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", onMove as any, { passive: false });
    window.addEventListener("pointerup", end as any);
    e.preventDefault();
  };

  const cuts = [0, ...pos, 100];

  const renderOverlay = (node: React.ReactNode, fromPct: number) =>
    isValidElement(node)
      ? cloneElement(node as any, {
          __containerW: c.w,
          __containerH: c.h,
          __sliceFromPct: fromPct,
        })
      : node;

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height,
          overflow: "hidden",
          borderRadius: 16,
          background: "#000",
        }}
      >
        {/* fixed background */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {background}
        </div>

        {/* slices */}
        {segs.map((seg, i) => {
          const from = cuts[i],
            to = cuts[i + 1];
          return (
            <div
              key={`s-${i}`}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${from}%`,
                width: `${to - from}%`,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              {seg.custom && (
                <div style={{ position: "absolute", inset: 0 }}>
                  {renderOverlay(seg.custom, from)}
                </div>
              )}
              {/* inside the slice render, where the label chip is drawn */}
              {showSliceLabels && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "2px 8px",
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    // NEW:
                    whiteSpace: "nowrap",
                    // optional safety if a label is super long:
                    maxWidth: "95%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    pointerEvents: "none",
                  }}
                >
                  {seg.label}
                </div>
              )}
            </div>
          );
        })}

        {/* handles */}
        {pos.map((p, i) => (
          <button
            key={`h-${i}`}
            onPointerDown={start(i)}
            aria-label={`Handle ${i + 1}`}
            style={{
              position: "absolute",
              left: `calc(${p}% - ${HANDLE_SIZE / 2}px)`,
              top: `calc(50% - ${HANDLE_SIZE / 2}px)`,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: "50%",
              backgroundColor: "#000",
              backgroundImage: `url("/cv-logo-vv.png")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: `60% 40%`,
              border: "2px solid #fff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              cursor: "ew-resize",
              outline: "none",
              zIndex: 2,
            }}
          />
        ))}
      </div>

      {showLegend && (
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
        >
          {segs.map((s, i) => (
            <span
              key={`lg-${i}`}
              style={{
                padding: "4px 8px",
                border: "1px solid #e5e5e5",
                borderRadius: 999,
                background: "#fff",
                fontSize: 13,
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
