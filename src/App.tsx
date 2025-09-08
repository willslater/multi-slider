import React from "react";
import MultiCompareSlider, { Segment } from "./MultiCompareSlider";

export default function App() {
  const src =
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const segments: Segment[] = [
    { label: "Original" },
    { label: "Grayscale", cssFilter: "grayscale(100%)" },
    { label: "Sepia", cssFilter: "sepia(100%)" },
    { label: "High Contrast", cssFilter: "contrast(160%) saturate(120%)" },
  ];

  return (
    <div className="container">
      <h1>Multi‑Handle Image Compare</h1>
      <p>
        Drag the grips or focus a grip and use ← → (hold Shift for larger
        steps).
      </p>
      <div className="card">
        <MultiCompareSlider
          src={src}
          alt="City skyline at sunset"
          segments={segments}
          initialPositions={[25, 50, 75]}
          height={420}
          showLegend
        />
      </div>
    </div>
  );
}
