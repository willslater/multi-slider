// App.tsx
import React, { useMemo, useRef, useState } from "react";
import MultiCompareSlider, { Segment } from "./MultiCompareSlider";
import ProductOverlay from "./ProductOverlay";
import { PRODUCTS } from "./products";
import { pitchPxFrom, ProductConfig } from "./types";

type Lighting = "day" | "night";
type Side = "inside" | "outside";

// ---------- Drag & Drop uploader ----------
function DropInput({
  label,
  onFile,
  previewSrc,
  accept = "image/*",
}: {
  label: string;
  onFile: (file: File) => void;
  previewSrc?: string;
  accept?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        width: 240,
        minHeight: 120,
        padding: 10,
        border: "2px dashed " + (dragOver ? "#444" : "#bbb"),
        borderRadius: 12,
        background: dragOver ? "#f4f6f8" : "#fafafa",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontSize: 13,
      }}
      title="Click or drag an image here"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      <strong>{label}</strong>
      <span style={{ color: "#666" }}>Click or drop image</span>
      {previewSrc && (
        <img
          src={previewSrc}
          alt={`${label} preview`}
          style={{
            width: "100%",
            height: 76,
            objectFit: "cover",
            borderRadius: 8,
            border: "1px solid #e3e3e3",
          }}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

// ---------- Default placeholders ----------
const DEFAULT_OUTSIDE_SCENE =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop&ixlib=rb-4.1.0";
const DEFAULT_INSIDE_SCENE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2144&auto=format&fit=crop&ixlib=rb-4.1.0";

export default function App() {
  // Scenes
  const [outsideSceneSrc, setOutsideSceneSrc] = useState<string | undefined>(
    undefined
  );
  const [insideSceneSrc, setInsideSceneSrc] = useState<string | undefined>(
    undefined
  );
  // Printed artwork (outside white face)
  const [artworkSrc, setArtworkSrc] = useState<string | undefined>(undefined);

  // View & lighting
  const [viewSide, setViewSide] = useState<Side>("inside");
  const [lighting, setLighting] = useState<Lighting>("day");

  // Viewer distance & screen scale
  const [distanceM, setDistanceM] = useState<number>(3);
  const [pxPerMm] = useState<number>(4); // make adjustable later if you want
  const REF_M = 3;

  // Enable/disable per-product, derived from PRODUCTS (so config is the source of truth)
  const [enabledIds, setEnabledIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.enabledDefault ?? true]))
  );

  const enabledProducts: ProductConfig[] = useMemo(
    () => PRODUCTS.filter((p) => enabledIds[p.id]),
    [enabledIds]
  );

  // Fixed background (one scene for all slices)
  const backgroundNode = useMemo(() => {
    const bgSrc =
      viewSide === "inside"
        ? outsideSceneSrc ?? DEFAULT_OUTSIDE_SCENE
        : insideSceneSrc ?? DEFAULT_INSIDE_SCENE;
    return (
      <img
        src={bgSrc}
        alt="Scene"
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }, [viewSide, outsideSceneSrc, insideSceneSrc]);

  // Build overlay segments from configs
  const segments: Segment[] = useMemo(() => {
    const base: Segment[] = [{ label: "Original" }];
    const rest: Segment[] = enabledProducts.map((config) => {
      const pitchPx = pitchPxFrom(config, pxPerMm, distanceM, REF_M);
      return {
        label: config.label,
        custom: (
          <ProductOverlay
            config={config}
            printSrc={artworkSrc}
            mode={viewSide}
            lighting={lighting}
            pitchPx={pitchPx}
          />
        ),
      };
    });
    return base.concat(rest);
  }, [enabledProducts, pxPerMm, distanceM, artworkSrc, viewSide, lighting]);

  // Even spacing (N segments → N−1 handles)
  const initialPositions = useMemo(() => {
    const n = segments.length;
    if (n < 2) return [];
    const cuts: number[] = [];
    for (let i = 1; i < n; i++) cuts.push(Math.round((i / n) * 100));
    return cuts;
  }, [segments.length]);

  // Remount key resets handle positions on changes
  const sliderKey = useMemo(() => {
    const ids = enabledProducts.map((p) => p.id).join("|") || "none";
    return `slider-${ids}-dist${distanceM}-mode${viewSide}-light${lighting}`;
  }, [enabledProducts, distanceM, viewSide, lighting]);

  return (
    <div
      className="container"
      style={{ maxWidth: 1160, margin: "24px auto", padding: 16 }}
    >
      <h1 style={{ margin: "0 0 8px" }}>Contra Vision Compare</h1>
      <p style={{ marginTop: 0 }}>
        Fixed background with overlay products from separate configs. HD uses a{" "}
        <strong>1&nbsp;mm</strong> hole; standard uses{" "}
        <strong>~1.6&nbsp;mm</strong>.
      </p>

      {/* Uploads */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          margin: "12px 0 16px",
        }}
      >
        <DropInput
          label="Outside Scene (seen when Inside)"
          previewSrc={outsideSceneSrc ?? DEFAULT_OUTSIDE_SCENE}
          onFile={(f) => setOutsideSceneSrc(URL.createObjectURL(f))}
        />
        <DropInput
          label="Inside Scene (seen when Outside)"
          previewSrc={insideSceneSrc ?? DEFAULT_INSIDE_SCENE}
          onFile={(f) => setInsideSceneSrc(URL.createObjectURL(f))}
        />
        <DropInput
          label="Artwork (printed on white face)"
          previewSrc={artworkSrc}
          onFile={(f) => setArtworkSrc(URL.createObjectURL(f))}
        />
      </div>

      {/* Toggles */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        {/* View side */}
        <div
          style={{
            display: "inline-flex",
            border: "1px solid #ddd",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setViewSide("inside")}
            style={{
              padding: "8px 12px",
              background: viewSide === "inside" ? "#111" : "#fff",
              color: viewSide === "inside" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
            }}
          >
            Inside (Black)
          </button>
          <button
            onClick={() => setViewSide("outside")}
            style={{
              padding: "8px 12px",
              background: viewSide === "outside" ? "#111" : "#fff",
              color: viewSide === "outside" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
            }}
          >
            Outside (White + Print)
          </button>
        </div>

        {/* Lighting */}
        <div
          style={{
            display: "inline-flex",
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
            Day (Outside Brighter)
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
            Night (Inside Brighter)
          </button>
        </div>

        {/* Viewing Distance */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13, color: "#333" }}>
            Viewing Distance: {distanceM.toFixed(1)} m
          </label>
          <input
            type="range"
            min={0.5}
            max={25}
            step={0.1}
            value={distanceM}
            onChange={(e) => setDistanceM(parseFloat(e.target.value))}
            style={{ width: 220 }}
          />
        </div>
      </div>

      {/* Product toggles (bound to configs) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
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
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={!!enabledIds[p.id]}
              onChange={(e) =>
                setEnabledIds((prev) => ({ ...prev, [p.id]: e.target.checked }))
              }
            />
            {p.label}
          </label>
        ))}
      </div>

      {/* Slider (fixed background + overlays from configs) */}
      {segments.length >= 2 && (
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
            showLegend
            showSliceLabels
          />
        </div>
      )}
    </div>
  );
}
