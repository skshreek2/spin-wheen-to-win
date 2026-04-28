import { useEffect, useMemo, useRef, useState } from "react";
import { layoutNextLineRange, materializeLineRange, prepareWithSegments } from "@chenglou/pretext";

const LINE_HEIGHT = 24;
const TEXT_FONT = "500 16px Inter";
const VIEWPORT_WIDTH = 900;
const VIEWPORT_HEIGHT = 460;
const COLUMN_GAP = 24;
const MIN_COLUMN_WIDTH = 210;
const ORB_RADIUS = 28;
const DOM_READS = 0;
const INITIAL_TEXT =
  "Editorial systems need deterministic text flow under moving constraints. Instead of querying the DOM to discover line positions, Pretext computes each line from pre-measured segments so updates are cheap and predictable. This playground simulates a magazine compositor: every row resolves available slots after subtracting orb intersections, then text pours through those slots left-to-right and top-to-bottom across columns. Drag any orb to stress the layout engine in real time. Click inside the viewport to pause and resume animation while preserving exact line ownership.";

const INITIAL_ORBS = [
  { id: "a", x: 200, y: 110, vx: 1.4, vy: 0.95, color: "#7dd3fc" },
  { id: "b", x: 480, y: 220, vx: -1.1, vy: 1.25, color: "#a7f3d0" },
  { id: "c", x: 730, y: 150, vx: -1.5, vy: -1.05, color: "#fbcfe8" },
];

export default function EditorialEngineDemo() {
  const [text, setText] = useState(INITIAL_TEXT);
  const [targetColumnWidth, setTargetColumnWidth] = useState(250);
  const [paused, setPaused] = useState(false);
  const [orbs, setOrbs] = useState(INITIAL_ORBS);
  const [fps, setFps] = useState(60);
  const dragRef = useRef(null);
  const rafRef = useRef(null);

  const prepared = useMemo(() => prepareWithSegments(text, TEXT_FONT), [text]);

  const columnCount = useMemo(() => {
    const requested = Math.floor((VIEWPORT_WIDTH + COLUMN_GAP) / (targetColumnWidth + COLUMN_GAP));
    return Math.max(1, requested);
  }, [targetColumnWidth]);

  const actualColumnWidth = useMemo(() => {
    const totalGap = (columnCount - 1) * COLUMN_GAP;
    const width = (VIEWPORT_WIDTH - totalGap) / columnCount;
    return Math.max(MIN_COLUMN_WIDTH, Math.floor(width));
  }, [columnCount]);

  const layout = useMemo(() => {
    const startedAt = performance.now();
    const lines = [];
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    const maxRows = Math.floor(VIEWPORT_HEIGHT / LINE_HEIGHT);

    for (let row = 0; row < maxRows; row += 1) {
      const y = row * LINE_HEIGHT;
      let hasPlacedInRow = false;

      for (let col = 0; col < columnCount; col += 1) {
        const colLeft = col * (actualColumnWidth + COLUMN_GAP);
        const colRight = colLeft + actualColumnWidth;
        const intervals = [{ start: colLeft, end: colRight }];

        for (let o = 0; o < orbs.length; o += 1) {
          const orb = orbs[o];
          const orbTop = orb.y - ORB_RADIUS;
          const orbBottom = orb.y + ORB_RADIUS;
          const overlapsRow = y < orbBottom && y + LINE_HEIGHT > orbTop;
          if (!overlapsRow) continue;

          const cutStart = orb.x - ORB_RADIUS - 6;
          const cutEnd = orb.x + ORB_RADIUS + 6;
          const nextIntervals = [];
          for (let i = 0; i < intervals.length; i += 1) {
            const it = intervals[i];
            if (cutEnd <= it.start || cutStart >= it.end) {
              nextIntervals.push(it);
              continue;
            }
            if (cutStart > it.start) {
              nextIntervals.push({ start: it.start, end: cutStart });
            }
            if (cutEnd < it.end) {
              nextIntervals.push({ start: cutEnd, end: it.end });
            }
          }
          intervals.length = 0;
          intervals.push(...nextIntervals);
        }

        for (let i = 0; i < intervals.length; i += 1) {
          const interval = intervals[i];
          const width = interval.end - interval.start;
          if (width < 44) continue;

          const range = layoutNextLineRange(prepared, cursor, width);
          if (!range) {
            const elapsedMs = performance.now() - startedAt;
            return { lines, reflowMs: elapsedMs };
          }
          const line = materializeLineRange(prepared, range);
          lines.push({ x: interval.start, y, width, text: line.text });
          cursor = range.end;
          hasPlacedInRow = true;
        }
      }

      if (!hasPlacedInRow) {
        const elapsedMs = performance.now() - startedAt;
        return { lines, reflowMs: elapsedMs };
      }
    }

    const elapsedMs = performance.now() - startedAt;
    return { lines, reflowMs: elapsedMs };
  }, [actualColumnWidth, columnCount, orbs, prepared]);

  useEffect(() => {
    let frameCount = 0;
    let prevFpsStamp = performance.now();
    let prevAnimStamp = performance.now();

    const tick = (now) => {
      frameCount += 1;
      const fpsElapsed = now - prevFpsStamp;
      if (fpsElapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / fpsElapsed));
        frameCount = 0;
        prevFpsStamp = now;
      }

      const dt = Math.max(0.5, Math.min(2.2, (now - prevAnimStamp) / 16.67));
      prevAnimStamp = now;

      if (!paused) {
        setOrbs((prev) =>
          prev.map((orb) => {
            if (dragRef.current?.id === orb.id) return orb;
            let x = orb.x + orb.vx * dt;
            let y = orb.y + orb.vy * dt;
            let vx = orb.vx;
            let vy = orb.vy;

            if (x - ORB_RADIUS < 0) {
              x = ORB_RADIUS;
              vx = Math.abs(vx);
            } else if (x + ORB_RADIUS > VIEWPORT_WIDTH) {
              x = VIEWPORT_WIDTH - ORB_RADIUS;
              vx = -Math.abs(vx);
            }

            if (y - ORB_RADIUS < 0) {
              y = ORB_RADIUS;
              vy = Math.abs(vy);
            } else if (y + ORB_RADIUS > VIEWPORT_HEIGHT) {
              y = VIEWPORT_HEIGHT - ORB_RADIUS;
              vy = -Math.abs(vy);
            }

            return { ...orb, x, y, vx, vy };
          }),
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused]);

  const updateDraggedOrb = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOrbs((prev) =>
      prev.map((orb) => {
        if (orb.id !== drag.id) return orb;
        const x = Math.max(ORB_RADIUS, Math.min(VIEWPORT_WIDTH - ORB_RADIUS, orb.x + e.movementX));
        const y = Math.max(ORB_RADIUS, Math.min(VIEWPORT_HEIGHT - ORB_RADIUS, orb.y + e.movementY));
        return { ...orb, x, y };
      }),
    );
  };

  return (
    <section style={{ display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 24 }}>The Editorial Engine</h3>
      <p style={{ margin: 0, color: "#475569" }}>
        Drag the orbs · Click to pause · Text reflows at 60fps · Zero DOM reads
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ padding: "6px 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8 }}>
          Lines {layout.lines.length}
        </span>
        <span style={{ padding: "6px 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8 }}>
          Reflow {layout.reflowMs.toFixed(2)}ms
        </span>
        <span style={{ padding: "6px 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8 }}>
          DOM reads {DOM_READS}
        </span>
        <span style={{ padding: "6px 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8 }}>
          FPS {fps}
        </span>
        <span style={{ padding: "6px 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8 }}>
          Columns {columnCount}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <label>
          Target column width: {targetColumnWidth}px{" "}
          <input
            type="range"
            min={200}
            max={420}
            value={targetColumnWidth}
            onChange={(e) => setTargetColumnWidth(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          style={{
            border: "1px solid #94a3b8",
            borderRadius: 8,
            padding: "0.45rem 0.8rem",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          minHeight: 110,
          padding: "0.7rem 0.8rem",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          font: "500 14px/1.5 Inter, system-ui, sans-serif",
          boxSizing: "border-box",
        }}
      />

      <div
        style={{
          width: "min(100%, 900px)",
          height: VIEWPORT_HEIGHT,
          position: "relative",
          margin: "0 auto",
          border: "1px solid #94a3b8",
          borderRadius: 12,
          background: "#fff",
          overflow: "hidden",
          font: "500 16px/24px Inter, system-ui, sans-serif",
        }}
        onClick={() => setPaused((p) => !p)}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerLeave={() => {
          dragRef.current = null;
        }}
      >
        {layout.lines.map((line, index) => (
          <div
            key={`${index}-${line.x}-${line.y}-${line.width}`}
            style={{
              position: "absolute",
              left: line.x,
              top: line.y,
              width: line.width,
              height: LINE_HEIGHT,
              lineHeight: `${LINE_HEIGHT}px`,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {line.text}
          </div>
        ))}

        {orbs.map((orb) => (
          <button
            key={orb.id}
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = {
                id: orb.id,
              };
            }}
            onPointerMove={updateDraggedOrb}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            style={{
              position: "absolute",
              left: orb.x - ORB_RADIUS,
              top: orb.y - ORB_RADIUS,
              width: ORB_RADIUS * 2,
              height: ORB_RADIUS * 2,
              borderRadius: "50%",
              border: "1px solid #334155",
              background: `radial-gradient(circle at 32% 28%, #fff 0%, ${orb.color} 62%, #38bdf8 100%)`,
              boxShadow: "0 6px 16px rgba(15, 23, 42, 0.2)",
              cursor: "grab",
            }}
          />
        ))}
      </div>
    </section>
  );
}
