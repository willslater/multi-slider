// App.tsx
import React, { useMemo, useState } from "react";
import MultiCompareSlider, {
  Segment,
} from "./components/slider/MultiCompareSlider";
import DropInput from "./components/DropInput";
import ProductOverlay from "./components/perf/ProductOverlay";
import { PRODUCTS } from "./config/products";
import { pitchPxFromMm } from "./lib/distance";
import { lightingOverlay, needsReverseVision } from "./lib/lighting";
import type { Lighting, Side } from "./types";

const DEFAULT_OUTSIDE =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop&ixlib=rb-4.1.0";
const DEFAULT_INSIDE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2144&auto=format&fit=crop&ixlib=rb-4.1.0";

export default function App() {
  // Images
  const [outsideScene, setOutsideScene] = useState<string>(); // what you see when you’re inside
  const [insideScene, setInsideScene] = useState<string>(); // what you see when you’re outside
  const [artwork, setArtwork] = useState<string>(); // printed on white (outside face)

  // Viewing / rendering
  const [side, setSide] = useState<Side>("inside");
  const [lighting, setLighting] = useState<Lighting>("day");
  const [distanceM, setDistanceM] = useState<number>(3);
  const [pxPerMm] = useState<number>(4);

  // Reverse-vision strength (night + outside): 0..0.6
  const [reverseStrength, setReverseStrength] = useState<number>(0.25);

  // Enabled products
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.enabledDefault ?? true]))
  );
  const enabledProducts = useMemo(
    () => PRODUCTS.filter((p) => enabled[p.id]),
    [enabled]
  );

  // Helpers
  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setSrc: (url: string) => void
  ) => {
    const f = e.target.files?.[0];
    if (f) setSrc(URL.createObjectURL(f));
  };

  // Fixed background scene (one layer for all slices) + lighting + reverse-vision
  const backgroundNode = useMemo(() => {
    // When inside, you look OUT → show outside scene. When outside, you look IN → show inside scene.
    const baseSrc =
      side === "inside"
        ? outsideScene ?? DEFAULT_OUTSIDE
        : insideScene ?? DEFAULT_INSIDE;

    const overlay = lightingOverlay(side, lighting);

    return (
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Main scene */}
        <img
          src={baseSrc}
          alt="Scene"
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Day/Night tint */}
        {overlay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: overlay,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Reverse-vision: at night, from outside, lit interior leaks through */}
        {needsReverseVision(side, lighting) && (
          <img
            src={insideScene ?? DEFAULT_INSIDE}
            alt="Lit interior through holes"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              mixBlendMode: "screen",
              opacity: Math.max(0, Math.min(0.6, reverseStrength)),
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  }, [side, lighting, outsideScene, insideScene, reverseStrength]);

  // Build slider segments (Original + enabled products)
  const segments: Segment[] = useMemo(() => {
    const base: Segment[] = [{ label: "Original" }];
    const rest: Segment[] = enabledProducts.map((p) => {
      const pitchPx = pitchPxFromMm(p.pitchMm, pxPerMm, distanceM, 3);
      return {
        label: p.label,
        custom: (
          <ProductOverlay
            config={p}
            pitchPx={pitchPx}
            side={side}
            lighting={lighting}
            printSrc={artwork}
            distanceM={distanceM}
          />
        ),
      };
    });
    return base.concat(rest);
  }, [enabledProducts, pxPerMm, distanceM, side, lighting, artwork]);

  // Evenly-spaced initial handles (N segments → N−1 handles)
  const initialPositions = useMemo(() => {
    const n = segments.length;
    if (n < 2) return [];
    const cuts: number[] = [];
    for (let i = 1; i < n; i++) cuts.push(Math.round((i / n) * 100));
    return cuts;
  }, [segments.length]);

  // Remount key to reset positions on key state changes
  const sliderKey = useMemo(() => {
    const ids = enabledProducts.map((p) => p.id).join("|") || "none";
    return `slider-${ids}-side${side}-light${lighting}-dist${distanceM}`;
  }, [enabledProducts, side, lighting, distanceM]);

  return (
    <div style={{ maxWidth: 1160, margin: "24px auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>Contra Vision Compare</h1>
      <p style={{ marginTop: 4 }}>
        Upload scenes, pick products, toggle inside/outside & day/night, and
        adjust viewing distance.
      </p>

      {/* Uploaders */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}
      >
        <DropInput
          label="Outside Scene (what you see from inside)"
          onFile={setOutsideScene}
          defaultSrc={DEFAULT_OUTSIDE}
        />
        <DropInput
          label="Inside Scene (what you see from outside)"
          onFile={setInsideScene}
          defaultSrc={DEFAULT_INSIDE}
        />
        <DropInput
          label="Artwork (printed on white face)"
          onFile={setArtwork}
        />
      </div>

      {/* Toggles */}
      <div
        style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}
      >
        {/* Side */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setSide("inside")}
            style={{
              padding: "8px 12px",
              background: side === "inside" ? "#111" : "#fff",
              color: side === "inside" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
            }}
          >
            Inside (view out)
          </button>
          <button
            onClick={() => setSide("outside")}
            style={{
              padding: "8px 12px",
              background: side === "outside" ? "#111" : "#fff",
              color: side === "outside" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
            }}
          >
            Outside (view in)
          </button>
        </div>

        {/* Lighting */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setLighting("day")}
            style={{
              padding: "8px 12px",
              background: lighting === "day" ? "#111" : "#fff",
              color: lighting === "day" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
            }}
          >
            Day
          </button>
          <button
            onClick={() => setLighting("night")}
            style={{
              padding: "8px 12px",
              background: lighting === "night" ? "#111" : "#fff",
              color: lighting === "night" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
            }}
          >
            Night
          </button>
        </div>

        {/* Viewing distance */}
        <label
          style={{
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Viewing Distance: {distanceM.toFixed(1)} m
          <input
            type="range"
            min={0.5}
            max={25}
            step={0.1}
            value={distanceM}
            onChange={(e) => setDistanceM(parseFloat(e.target.value))}
            style={{ width: 220 }}
          />
        </label>

        {/* Reverse-vision strength (only meaningful when outside+night, but always adjustable) */}
        <label
          style={{
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Interior Light (reverse-vision): {Math.round(reverseStrength * 100)}%
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.01}
            value={reverseStrength}
            onChange={(e) => setReverseStrength(parseFloat(e.target.value))}
            style={{ width: 220 }}
          />
        </label>
      </div>

      {/* Product toggles */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
          padding: 10,
          border: "1px solid #eee",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        {PRODUCTS.map((p) => (
          <label
            key={p.id}
            style={{
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              type="checkbox"
              checked={!!enabled[p.id]}
              onChange={(e) =>
                setEnabled((prev) => ({ ...prev, [p.id]: e.target.checked }))
              }
            />
            {p.label}
          </label>
        ))}
      </div>

      {/* Slider */}
      <div
        className="card"
        style={{
          background: "#fff",
          border: "1px solid #e3e3e3",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <MultiCompareSlider
          key={sliderKey}
          background={backgroundNode}
          segments={segments}
          initialPositions={initialPositions}
          height={460}
          showLegend={false}
          showSliceLabels
        />
      </div>

      <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
        Tip: Drag the grips, or focus a grip and use ← → (hold Shift for larger
        steps).
      </p>
    </div>
  );
}
