// components/SpinWheel/ResultPanel.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import {
  RESULT_HORIZONTAL_PADDING,
  RESULT_LINE_HEIGHT,
  RESULT_WAVE_INSET,
  RESULT_WAVE_BUFFER,
} from "../constants";

export function ResultPanel({
  displayedResultText,
  isResultVisible,
  isResultReady,
}) {
  const resultTextRef = useRef(null);
  const [resultTextWidth, setResultTextWidth] = useState(620);
  const [resultTextHeight, setResultTextHeight] = useState(380);
  const [resultWavePhase, setResultWavePhase] = useState(0);

  const [pendingResult, setPendingResult] = useState("");
  const [hasPendingResult, setHasPendingResult] = useState(false);
  const [blastPhase, setBlastPhase] = useState(0); // 0 = none, 1 = blasting, 2 = off

  const previousResultRef = useRef("");

  const [resultRipples, setResultRipples] = useState([
    { x: 280, y: 130, t0: 0, strength: 1.1 },
  ]);

  useEffect(() => {
    if (!isResultReady) return;

    const oldResult = previousResultRef.current;
    const newResult = displayedResultText;

    if (oldResult !== newResult) {
      setPendingResult(newResult);
      previousResultRef.current = newResult;

      // start blast
      setHasPendingResult(true);
      setBlastPhase(1);

      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.03, (now - last) / 1000);
        last = now;

        setBlastPhase((p) => {
          const pNew = p + dt * 2; // blast duration around 0.5s
          if (pNew >= 2) {
            // blast done, actual result is fully visible
            return 2;
          }
          return pNew;
        });
      };
      const rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    }
  }, [displayedResultText, isResultReady]);

  useEffect(() => {
    let last = performance.now();
    let rafId = null;
    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      setResultWavePhase((prev) => prev + dt * 3.3);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!resultTextRef.current || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const updateWidth = () => {
      if (!resultTextRef.current) return;
      setResultTextWidth(Math.max(160, resultTextRef.current.clientWidth));
      setResultTextHeight(resultTextRef.current.clientHeight);
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(resultTextRef.current);

    return () => observer.disconnect();
  }, []);

  const preparedResult = useMemo(
    () =>
      prepareWithSegments(displayedResultText, "500 16px Inter", {
        whiteSpace: "pre-wrap",
        wordBreak: "keep-all",
        letterSpacing: 1,
      }),
    [displayedResultText],
  );

  const resultLayout = useMemo(() => {
    const usableWidth = Math.max(
      160,
      resultTextWidth - RESULT_HORIZONTAL_PADDING,
    );
    return layoutWithLines(preparedResult, usableWidth, RESULT_LINE_HEIGHT);
  }, [preparedResult, resultTextWidth]);

  return (
    <div className="result-panel">
      <label htmlFor="result-text">Spin Result</label>
      <div
        ref={resultTextRef}
        id="result-text"
        aria-live="polite"
        className={`result-text result-wave ${isResultVisible ? "is-visible" : "is-hidden"}`}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
          const y = e.clientY - rect.top + e.currentTarget.scrollTop;
          setResultRipples((prev) => [
            ...prev.slice(-10),
            { x, y, t0: resultWavePhase, strength: 1.45 },
            { x, y, t0: resultWavePhase + 0.24, strength: 1.0 },
          ]);
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: Math.max(
              resultTextHeight,
              resultLayout.lineCount * RESULT_LINE_HEIGHT +
                RESULT_WAVE_INSET * 2,
            ),
          }}
        >
          {resultLayout.lines.map((line, index) => {
            const baseX = RESULT_WAVE_INSET;
            const y = RESULT_WAVE_INSET + index * RESULT_LINE_HEIGHT;
            const availableLineWidth = resultTextWidth - RESULT_WAVE_INSET * 2;
            const lineWidth = Math.min(
              availableLineWidth,
              Math.ceil(line.width) + RESULT_WAVE_BUFFER,
            );
            const lineCenterX = baseX + lineWidth * 0.5;

            // --- blast effect when changing results ---
            const BLAST_SCALE_START = 1.0;
            const BLAST_SCALE_END = 2.4;
            const BLAST_OPACITY_START = 1;
            const BLAST_OPACITY_END = 0.0;

            let blastScale = BLAST_SCALE_START;
            let blastOpacity = BLAST_OPACITY_START;
            if (blastPhase > 0) {
              const t = Math.min(1, blastPhase - 1); // 0 → 1 during blast
              blastScale =
                BLAST_SCALE_START + t * (BLAST_SCALE_END - BLAST_SCALE_START);
              blastOpacity =
                BLAST_OPACITY_START +
                t * (BLAST_OPACITY_END - BLAST_OPACITY_START);
            }
            // blast effect ends

            let rippleX = 0;
            let rippleY = 0;
            for (let i = 0; i < resultRipples.length; i += 1) {
              const drop = resultRipples[i];
              const age = Math.max(0, resultWavePhase - drop.t0);
              if (age > 13) continue;
              const dx = lineCenterX - drop.x;
              const dy = y - drop.y;
              const distance = Math.hypot(dx, dy) + 0.0001;
              const waveFront = age * 130;
              const travel = distance - waveFront;
              const envelope = Math.exp(-distance / 520) * Math.exp(-age / 7.2);
              const crestWidth = 26;
              const crest = Math.exp(
                -(travel * travel) / (2 * crestWidth * crestWidth),
              );
              const ring = crest * envelope * (drop.strength ?? 1) * 16;
              rippleX += (dx / distance) * ring * 0.42;
              rippleY += (dy / distance) * ring * 0.3;
            }

            const resultOpacity =
              !isResultVisible || blastPhase < 1
                ? 0
                : blastPhase < 1.5
                  ? 1
                  : blastOpacity;

            const baseSwellX =
              Math.sin(resultWavePhase * 1.8 + y * 0.02) * 3.2 +
              Math.sin(resultWavePhase * 1.1) * 1.6;
            const baseSwellY =
              Math.cos(resultWavePhase * 1.4 + y * 0.015) * 1.2;
            const xOffset = baseSwellX + rippleX;
            const yOffset = baseSwellY + rippleY;

            const edgePadding = 10;
            const maxRight =
              resultTextWidth - (baseX + lineWidth) - edgePadding;
            const maxLeft = baseX - edgePadding;
            const safeX = Math.max(-maxLeft, Math.min(maxRight, xOffset));

            return (
              <div
                key={`${index}-${line.width}`}
                style={{
                  position: "absolute",
                  left: baseX,
                  top: y,
                  width: lineWidth,
                  height: RESULT_LINE_HEIGHT,
                  lineHeight: `${RESULT_LINE_HEIGHT}px`,
                  whiteSpace: "pre",
                  overflow: "hidden",
                  color: "#0f172a",
                  textShadow: "0 1px 0 rgba(255,255,255,0.82)",
                  willChange: "transform, opacity",
                  transform: `translate3d(${safeX}px, ${yOffset}px, 0) scale(${blastScale}) rotate(${blastPhase > 1 ? (blastPhase - 1) * 8 : 0}deg)`,
                  opacity: 1,
                  filter:
                    blastPhase > 1
                      ? `blur(${Math.min(6, (blastPhase - 1) * 4)}px)`
                      : "none",
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
