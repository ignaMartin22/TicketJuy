"use client";

import { useId, useRef, useState } from "react";
import { compressImage } from "../_lib/image";
import { ImageIcon } from "./icons";
import { buttonClass } from "./ui";

/** Foto de portada: elegir, ver cómo queda, cambiar o sacar. */
export function CoverInput({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}) {
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pick = () => input.current?.click();

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await compressImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar la imagen.");
    } finally {
      setBusy(false);
      // Permite volver a elegir el mismo archivo.
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        tabIndex={-1}
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Vista previa de la portada"
            className="aspect-[4/5] w-full max-w-56 rounded-2xl border border-linea object-cover"
          />
          <div className="flex flex-wrap gap-2 whitespace-nowrap">
            <button
              type="button"
              className={buttonClass.secondary}
              onClick={pick}
              disabled={busy}
              aria-describedby={hintId}
            >
              {busy ? "Procesando…" : "Cambiar foto"}
            </button>
            <button type="button" className={buttonClass.secondary} onClick={() => onChange(undefined)}>
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-describedby={hintId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files[0]);
          }}
          className={`flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center transition-colors ${
            dragging ? "border-accent bg-accent/10" : "border-linea hover:border-accent/60"
          }`}
        >
          <ImageIcon />
          <span className="font-semibold">{busy ? "Procesando…" : "Subir foto de portada"}</span>
          <span className="text-sm text-tenue">Arrastrala acá o hacé click para elegirla</span>
        </button>
      )}

      <p id={hintId} className="mt-2 text-sm text-tenue">
        JPG, PNG o WebP. Vertical (4:5) queda mejor, como un flyer.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
