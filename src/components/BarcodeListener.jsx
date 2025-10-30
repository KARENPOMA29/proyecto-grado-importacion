// src/components/BarcodeListener.jsx
import { useEffect, useRef } from "react";

export default function BarcodeListener({
  onScan,
  targetRef,      // 👈 el input que debe tener el foco (serieInputRef)
  minLength = 3,
  enabled = true,
  debug = false,
  autoLength = 13,
  gapMs = 120,
}) {
  const bufferRef = useRef("");
  const lastTimeRef = useRef(0);
  const lastScanRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // 👉 1. Solo escuchar si el foco está en el input de serie
      if (
        !targetRef?.current ||
        document.activeElement !== targetRef.current
      ) {
        return;
      }

      const now = Date.now();

      // 2. Ignorar Enter extra
      if (now - lastScanRef.current < 80) {
        if (debug) console.log("[BARCODE] enter extra ignorado");
        return;
      }

      const diff = now - lastTimeRef.current;
      if (diff > gapMs) bufferRef.current = "";
      lastTimeRef.current = now;

      const key = typeof e.key === "string" ? e.key : "";

      // 3. Enter o Tab = fin del código
      if (key === "Enter" || key === "Tab") {
        const code = bufferRef.current.trim();
        if (debug) console.log("[BARCODE] ENTER/TAB →", `"${code}"`);
        if (code.length >= minLength) {
          onScan?.(code);
          lastScanRef.current = now;
        }
        bufferRef.current = "";
        return;
      }

      // 4. Agregar solo teclas visibles
      if (key.length === 1) {
        bufferRef.current += key;
        if (debug) console.log("[BARCODE] tecla:", key, "buffer:", bufferRef.current);

        if (
          typeof autoLength === "number" &&
          autoLength > 0 &&
          bufferRef.current.length >= autoLength
        ) {
          const code = bufferRef.current.trim();
          if (debug) console.log("[BARCODE] autoLength →", `"${code}"`);
          onScan?.(code);
          lastScanRef.current = now;
          bufferRef.current = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan, targetRef, enabled, debug, autoLength, gapMs, minLength]);

  return null;
}
