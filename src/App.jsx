import { useEffect, useMemo, useRef, useState } from "react";
import { layoutWithLines, measureLineStats, prepareWithSegments } from "@chenglou/pretext";
import "./App.css";
import NEFTFullText from "./NEFTFullText";
import UPIFullText from "./UPIFullText";
import AddPayeeFullText from "./AddPayeeFullText";
import ManagePayeeFullText from "./ManagePayeeFullText";
import IMPSFullText from "./IMPSFullText";
import RTGSFullText from "./RTGSFullText";
import {
  ADD_PAYEE,
  IMPS,
  MANAGE_PAYEE,
  NEFT_TRANSFER,
  RTGS,
  UPI_TRANSFER,
} from "./constants";
import PretextFlowDemo from "./PretextFlowDemo.jsx";
import DomnpreText from "./DomnpreText.jsx";

const WHEEL_ITEMS = [
  UPI_TRANSFER,
  NEFT_TRANSFER,
  ADD_PAYEE,
  MANAGE_PAYEE,
  IMPS,
  RTGS,
];
const SEGMENT_ANGLE = 360 / WHEEL_ITEMS.length;
const LABEL_START_ANGLE = 90;
const POINTER_ANGLE = 270;
const RESULT_LINE_HEIGHT = 24;
const RESULT_LINE_COUNT = 10;
const RESULT_FADE_MS = 600;
const RESULT_HORIZONTAL_PADDING = 24;
const RESULT_WAVE_BUFFER = 12;
const RESULT_WAVE_INSET = 12;
const RESULT_DETAILS = {
  [UPI_TRANSFER]: UPIFullText,
  [NEFT_TRANSFER]: NEFTFullText,
  [ADD_PAYEE]: AddPayeeFullText,
  [MANAGE_PAYEE]: ManagePayeeFullText,
  [IMPS]: IMPSFullText,
  [RTGS]: RTGSFullText,
};
const ITEM_ICONS = {
  [UPI_TRANSFER]: "📱",
  [NEFT_TRANSFER]: "🏦",
  [ADD_PAYEE]: "➕",
  [MANAGE_PAYEE]: "🛠️",
  [IMPS]: "⚡",
  [RTGS]: "💸",
};

const buildLongResultText = (selectedItem) => {
  const heading = selectedItem
    ? `Result: ${selectedItem}\n\nDetailed spin report:\n`
    : "Press spin to test your luck!\n\nDetailed spin report:\n";

  const details = RESULT_DETAILS[selectedItem];
  if (details) {
    return `${heading}${details}`;
  }

  const lines = Array.from({ length: RESULT_LINE_COUNT }, (_, idx) => {
    const lineNo = idx + 1;
    const itemLabel = selectedItem || "Pending";
    return `Line ${lineNo}: Spin status for ${itemLabel}`;
  });

  return `${heading}${lines.join("\n")}`;
};

function App() {
  const [selectionMode, setSelectionMode] = useState("performance");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedResultText, setDisplayedResultText] = useState(() =>
    buildLongResultText(""),
  );
  const [isResultVisible, setIsResultVisible] = useState(true);
  const fadeTimeoutRef = useRef(null);
  const resultTextRef = useRef(null);
  const [resultTextWidth, setResultTextWidth] = useState(620);
  const [resultTextHeight, setResultTextHeight] = useState(380);
  const [resultWavePhase, setResultWavePhase] = useState(0);
  const [resultRipples, setResultRipples] = useState([
    { x: 280, y: 130, t0: 0, strength: 1.1 },
  ]);
  const point2Text =
    "Pretext lets you lay out text line by line. You get the actual line strings, their widths, and cursor positions. This means you can render to canvas, SVG, or WebGL - not just the DOM. You can also vary the available width per line, flowing text around images or other obstacles.";
  const [point2MaxWidth, setPoint2MaxWidth] = useState(350);

  const wheelStyle = useMemo(
    () => ({
      transform: `rotate(${rotation}deg)`,
      transition: isSpinning
        ? "transform 6s cubic-bezier(0.12, 0.8, 0.18, 1)"
        : "none",
    }),
    [isSpinning, rotation],
  );

  const onSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    const extraTurns = 8;
    const randomStop = Math.floor(Math.random() * 360);
    setRotation((prev) => prev + extraTurns * 360 + randomStop);
  };

  const onSpinEnd = () => {
    const normalized = ((rotation % 360) + 360) % 360;
    const delta =
      (((POINTER_ANGLE - LABEL_START_ANGLE - normalized) % 360) + 360) % 360;
    const index =
      Math.floor((delta + SEGMENT_ANGLE / 2) / SEGMENT_ANGLE) %
      WHEEL_ITEMS.length;
    const nextWinner = WHEEL_ITEMS[index];

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    setIsResultVisible(false);
    fadeTimeoutRef.current = setTimeout(() => {
      setDisplayedResultText(buildLongResultText(nextWinner));
      setIsResultVisible(true);
      fadeTimeoutRef.current = null;
    }, RESULT_FADE_MS);

    setIsSpinning(false);
  };

  useEffect(() => {
    if (!resultTextRef.current || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const updateWidth = () => {
      if (!resultTextRef.current) return;
      setResultTextWidth(resultTextRef.current.clientWidth);
      setResultTextHeight(resultTextRef.current.clientHeight);
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(resultTextRef.current);

    return () => observer.disconnect();
  }, []);

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

  const preparedResult = useMemo(
    () => prepareWithSegments(displayedResultText, "500 16px Inter"),
    [displayedResultText],
  );

  const resultLayout = useMemo(() => {
    const usableWidth = Math.max(160, resultTextWidth - RESULT_HORIZONTAL_PADDING);
    return layoutWithLines(preparedResult, usableWidth, RESULT_LINE_HEIGHT);
  }, [preparedResult, resultTextWidth]);

  const point2Prepared = useMemo(
    () => prepareWithSegments(point2Text, "16px Inter"),
    [point2Text],
  );

  const point2Metrics = useMemo(() => {
    const { lineCount } = measureLineStats(point2Prepared, point2MaxWidth);

    let lo = 50;
    let hi = point2MaxWidth;
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      if (measureLineStats(point2Prepared, mid).lineCount <= lineCount) {
        hi = mid;
      } else {
        lo = mid;
      }
    }

    const shrinkWrappedWidth = Math.ceil(
      measureLineStats(point2Prepared, Math.ceil(hi)).maxLineWidth,
    );

    return {
      lineCount,
      shrinkWrappedWidth,
      savedPx: Math.max(0, point2MaxWidth - shrinkWrappedWidth),
    };
  }, [point2Prepared, point2MaxWidth]);

  return (
    <main className={`app ${selectionMode === "user-experiance" ? "app--user-experiance" : ""}`}>
      <section className="mode-selector" aria-label="Selection Mode">
        <label className="mode-option">
          <input
            type="radio"
            name="selection-mode"
            value="performance"
            checked={selectionMode === "performance"}
            onChange={(e) => setSelectionMode(e.target.value)}
          />
          <span>Performance</span>
        </label>
        <label className="mode-option">
          <input
            type="radio"
            name="selection-mode"
            value="user-experiance"
            checked={selectionMode === "user-experiance"}
            onChange={(e) => setSelectionMode(e.target.value)}
          />
          <span>User Experiance</span>
        </label>
      </section>

      {selectionMode === "performance" ? (
        <section
          className="pretext-demo-section"
          style={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}
        >
          <h1>Performance Comparison</h1>
          <p className="app-subtitle">
            Compare hidden DOM measurement against Pretext layout performance.
          </p>
          <DomnpreText />
          <section
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid #dbeafe",
            }}
          >
            <h2 style={{ margin: "0 0 8px" }}>
              Performance Test 2 : measureLineStats() shrink-wrap
            </h2>
            <p style={{ margin: "0 0 10px", color: "#475569", fontSize: 14 }}>
              Binary search the tightest bubble width while keeping the same line count.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
              <label htmlFor="point2-max-width" style={{ fontWeight: 600 }}>
                Max width
              </label>
              <input
                id="point2-max-width"
                type="range"
                min={150}
                max={600}
                value={point2MaxWidth}
                onChange={(e) => setPoint2MaxWidth(Number(e.target.value))}
              />
              <code>{point2MaxWidth}px</code>
            </div>

            <p style={{ margin: "8px 0 12px", color: "#475569", fontSize: 14 }}>
              Normal: {point2MaxWidth}px. Shrink-wrapped: {point2Metrics.shrinkWrappedWidth}px (
              {point2Metrics.savedPx}px saved, same {point2Metrics.lineCount} lines).
            </p>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  Normal (max-width)
                </div>
                <div
                  style={{
                    width: `${point2MaxWidth}px`,
                    maxWidth: "100%",
                    font: "500 16px/24px Inter, system-ui, sans-serif",
                    background: "#e3f2fd",
                    borderRadius: 12,
                    padding: "8px 12px",
                    overflowWrap: "break-word",
                    boxSizing: "border-box",
                  }}
                >
                  {point2Text}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  Shrink-wrapped
                </div>
                <div
                  style={{
                    width: `${point2Metrics.shrinkWrappedWidth}px`,
                    maxWidth: "100%",
                    font: "500 16px/24px Inter, system-ui, sans-serif",
                    background: "#e8f5e9",
                    borderRadius: 12,
                    padding: "8px 12px",
                    overflowWrap: "break-word",
                    boxSizing: "border-box",
                  }}
                >
                  {point2Text}
                </div>
              </div>
            </div>
          </section>
        </section>
      ) : (
        <>
          <h1>Spin Wheel To Win</h1>
          <p className="app-subtitle">
            Spin the wheel and explore the obstacle reflow demo powered by Pretext.
          </p>
          <section className="content-row">
            <div className="wheel-panel">
              <div className="wheel-wrapper">
                <div className="pointer" aria-hidden="true" />
                <div className="wheel" style={wheelStyle} onTransitionEnd={onSpinEnd}>
                  <ul className="labels">
                    {WHEEL_ITEMS.map((item, index) => (
                      <li
                        key={item}
                        style={{
                          transform: `rotate(${index * SEGMENT_ANGLE + LABEL_START_ANGLE}deg)`,
                        }}
                      >
                        <span className="label-content">
                          <span className="label-icon" aria-hidden="true">
                            {ITEM_ICONS[item]}
                          </span>
                          <span className="label-text">{item}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button className="spin-btn" onClick={onSpin} disabled={isSpinning}>
                {isSpinning ? "Spinning..." : "Spin Now"}
              </button>
            </div>

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
                    ...prev.slice(-6),
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
                      resultLayout.lineCount * RESULT_LINE_HEIGHT + RESULT_WAVE_INSET * 2,
                    ),
                  }}
                >
                  {resultLayout.lines.map((line, index) => {
                    const baseX = RESULT_WAVE_INSET;
                    const y = RESULT_WAVE_INSET + index * RESULT_LINE_HEIGHT;
                    const availableLineWidth = Math.max(
                      40,
                      resultTextWidth - RESULT_WAVE_INSET * 2,
                    );
                    const lineWidth = Math.min(
                      availableLineWidth,
                      Math.ceil(line.width) + RESULT_WAVE_BUFFER,
                    );
                    const lineCenterX = baseX + lineWidth * 0.5;

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
                      const crest = Math.exp(-(travel * travel) / (2 * crestWidth * crestWidth));
                      const ring = crest * envelope * (drop.strength ?? 1) * 9;
                      rippleX += (dx / distance) * ring * 0.42;
                      rippleY += (dy / distance) * ring * 0.3;
                    }

                    const baseSwellX =
                      Math.sin(resultWavePhase * 1.35 + y * 0.018) * 1.7 +
                      Math.sin(resultWavePhase * 0.7) * 0.8;
                    const baseSwellY = Math.cos(resultWavePhase * 1.05 + y * 0.012) * 0.55;
                    const xOffset = baseSwellX + rippleX;
                    const yOffset = baseSwellY + rippleY;

                    const edgePadding = 10;
                    const maxRight = resultTextWidth - (baseX + lineWidth) - edgePadding;
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
                          transform: `translate3d(${safeX}px, ${yOffset}px, 0)`,
                          color: "#0f172a",
                          textShadow: "0 1px 0 rgba(255,255,255,0.82)",
                          willChange: "transform",
                        }}
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="pretext-demo-section">
            <h2>@chenglou/pretext - Obstacle Reflow Demo</h2>
            <p>Drag the obstacle image. Text auto aligns and reflows line-by-line.</p>
            <PretextFlowDemo />
          </section>

        </>
      )}

    </main>
  );
}

export default App;
