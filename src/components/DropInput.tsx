// components/DropInput.tsx
import React, { useCallback, useRef, useState, useEffect } from "react";

type DropInputProps = {
  label: string;
  accept?: string;
  onFile: (url: string) => void;
  defaultSrc?: string;
};

export default function DropInput({
  label,
  accept = "image/*",
  onFile,
  defaultSrc,
}: DropInputProps) {
  const [isOver, setIsOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If defaultSrc provided and no preview, show it
  useEffect(() => {
    if (!preview && defaultSrc) {
      setPreview(defaultSrc);
      onFile(defaultSrc);
    }
  }, [defaultSrc, preview, onFile]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f) {
        const url = URL.createObjectURL(f);
        setPreview(url);
        onFile(url);
      }
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: "2px dashed #aaa",
        borderRadius: 8,
        padding: "12px 16px",
        textAlign: "center",
        fontSize: 13,
        background: isOver ? "#f0f8ff" : "#fafafa",
        cursor: "pointer",
        width: 220,
        height: 160,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="preview"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              padding: "0 8px",
            }}
          >
            {label} (replace)
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontWeight: 500 }}>{label}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
            Drag & drop or click
          </p>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
