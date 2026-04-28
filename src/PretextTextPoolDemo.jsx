import { useEffect, useMemo, useRef, useState } from "react";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";

const MAX_VIEW_WIDTH = 920;
const VIEW_HEIGHT = 500;
const LINE_HEIGHT = 24;
const FONT = "500 16px Inter";
const TEXT_BLOCK_WIDTH = 820;
const TEXT_LEFT_SAFE_PADDING = 0;
const TEXT_RIGHT_SAFE_PADDING = 0;
const LINE_RENDER_BUFFER = 14;

const DEFAULT_TEXT =
  "The pool of text shimmers as each line is recomputed with Pretext and then displaced by wave math. " +
  "This keeps the layout deterministic while still feeling organic and alive. " +
  "Move your cursor over the pool to create stronger local ripples. " +
  "Because line layout is separated from visual displacement, the effect remains stable and fast even while animating. " +
  "This pattern is useful for editorial and storytelling surfaces where typography should feel cinematic without sacrificing readability." +
  "The pool of text shimmers as each line is recomputed with Pretext and then displaced by wave math. " +
  "This keeps the layout deterministic while still feeling organic and alive. " +
  "Move your cursor over the pool to create stronger local ripples. " +
  "Because line layout is separated from visual displacement, the effect remains stable and fast even while animating. " +
  "This pattern is useful for editorial and storytelling surfaces where typography should feel cinematic without sacrificing readability."+
  "The pool of text shimmers as each line is recomputed with Pretext and then displaced by wave math. " +
  "This keeps the layout deterministic while still feeling organic and alive. " +
  "Move your cursor over the pool to create stronger local ripples. " +
  "Because line layout is separated from visual displacement, the effect remains stable and fast even while animating. " +
  "This pattern is useful for editorial and storytelling surfaces where typography should feel cinematic without sacrificing readability."+
  "The pool of text shimmers as each line is recomputed with Pretext and then displaced by wave math. " +
  "This keeps the layout deterministic while still feeling organic and alive. " +
  "Move your cursor over the pool to create stronger local ripples. " +
  "Because line layout is separated from visual displacement, the effect remains stable and fast even while animating. " +
  "This pattern is useful for editorial and storytelling surfaces where typography should feel cinematic without sacrificing readability."
  ;

export default function PretextTextPoolDemo() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [speed, setSpeed] = useState(1);
  const [amplitude, setAmplitude] = useState(16);
  const [frequency, setFrequency] = useState(0.035);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(MAX_VIEW_WIDTH);
  const [pointer, setPointer] = useState({
    x: MAX_VIEW_WIDTH * 0.5,
    y: VIEW_HEIGHT * 0.5,
    active: false,
  });
  const [ripples, setRipples] = useState([
    { x: MAX_VIEW_WIDTH * 0.5, y: VIEW_HEIGHT * 0.45, t0: 0, strength: 1.1 },
  ]);
  const rafRef = useRef(null);
  const viewportRef = useRef(null);

  const textBlockWidth = useMemo(
    () => Math.max(320, Math.min(TEXT_BLOCK_WIDTH, viewportWidth - 24)),
    [viewportWidth],
  );

  const prepared = useMemo(() => prepareWithSegments(text, FONT), [text]);
  const layout = useMemo(
    () =>
      layoutWithLines(
        prepared,
        textBlockWidth - TEXT_LEFT_SAFE_PADDING - TEXT_RIGHT_SAFE_PADDING,
        LINE_HEIGHT,
      ),
    [prepared, textBlockWidth],
  );

  useEffect(() => {
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      if (!isPaused) {
        setPhase((p) => p + dt * speed * 3.8);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPaused, speed]);

  useEffect(() => {
    if (!viewportRef.current || typeof ResizeObserver === "undefined") return undefined;
    const updateWidth = () => {
      if (!viewportRef.current) return;
      setViewportWidth(Math.max(320, Math.floor(viewportRef.current.clientWidth)));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  const lineStartY = Math.max(28, Math.floor((VIEW_HEIGHT - layout.lineCount * LINE_HEIGHT) / 2));

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 24 }}>Pool of Text</h3>
      <p style={{ margin: 0, color: "#475569" }}>
        Click inside the pool to drop a stone and emit circular waves.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Speed: {speed.toFixed(1)}{" "}
          <input
            type="range"
            min={0.2}
            max={2.4}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
        <label>
          Amplitude: {amplitude}px{" "}
          <input
            type="range"
            min={4}
            max={34}
            step={1}
            value={amplitude}
            onChange={(e) => setAmplitude(Number(e.target.value))}
          />
        </label>
        <label>
          Frequency: {frequency.toFixed(3)}{" "}
          <input
            type="range"
            min={0.015}
            max={0.08}
            step={0.001}
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          style={{
            border: "1px solid #94a3b8",
            borderRadius: 8,
            padding: "0.45rem 0.8rem",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {isPaused ? "Resume" : "Pause"}
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
        ref={viewportRef}
        style={{
          width: "min(100%, 920px)",
          height: VIEW_HEIGHT,
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          borderRadius: 14,
          border: "1px solid #cbd5e1",
          background: "#ffffff",
          boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.2)",
          color: "#0f172a",
          font: "500 16px/24px Inter, system-ui, sans-serif",
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPointer({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            active: true,
          });
        }}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setRipples((prev) => [
            ...prev.slice(-6),
            { x, y, t0: phase, strength: 1.45 },
            { x, y, t0: phase + 0.28, strength: 1.05 },
            { x, y, t0: phase + 0.56, strength: 0.72 },
          ]);
        }}
        onPointerLeave={() => setPointer((prev) => ({ ...prev, active: false }))}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 25% 20%, rgba(14,116,144,0.06) 0%, transparent 46%), radial-gradient(circle at 78% 70%, rgba(14,116,144,0.05) 0%, transparent 42%)",
            pointerEvents: "none",
          }}
        />

        {layout.lines.map((line, index) => {
          const baseX = Math.floor((viewportWidth - textBlockWidth) / 2);
          const textLeft = baseX + TEXT_LEFT_SAFE_PADDING;
          const textWidth = textBlockWidth - TEXT_LEFT_SAFE_PADDING - TEXT_RIGHT_SAFE_PADDING;
          const lineRenderWidth = Math.min(textWidth, Math.ceil(line.width) + LINE_RENDER_BUFFER);
          const y = lineStartY + index * LINE_HEIGHT;
          const depth = index / Math.max(1, layout.lines.length - 1);
          const lineCenterX = textLeft + lineRenderWidth * 0.5;
          const phaseShift = phase + depth * 1.35;
          const baseSwellX =
            Math.sin(phaseShift * 1.35 + y * frequency * 0.55) * (amplitude * 0.22) +
            Math.sin(phaseShift * 0.62) * 1.1;
          const baseSwellY = Math.cos(phaseShift * 1.1 + y * 0.013) * 0.8;

          let rippleX = 0;
          let rippleY = 0;
          for (let i = 0; i < ripples.length; i += 1) {
            const drop = ripples[i];
            const age = Math.max(0, phase - drop.t0);
            if (age > 14) continue;

            const dx = lineCenterX - drop.x;
            const dy = y - drop.y;
            const distance = Math.hypot(dx, dy) + 0.0001;
            const waveFront = age * (150 * speed);
            const travel = distance - waveFront;
            const envelope = Math.exp(-distance / 560) * Math.exp(-age / 7.2);
            const strength = drop.strength ?? 1;

            // Expanding circular crest that moves outward until borders.
            const crestWidth = 28;
            const crest = Math.exp(-(travel * travel) / (2 * crestWidth * crestWidth));
            const trailing = Math.exp(-Math.max(0, travel) / 80) * Math.sin(Math.max(0, travel) * 0.17);
            const splashCore = Math.exp(-distance / 140) * Math.exp(-age / 1.5) * 0.42;
            const ring = (crest * 1.35 + trailing * 0.38 + splashCore) * envelope * amplitude * strength;

            rippleX += (dx / distance) * ring * 0.52;
            rippleY += (dy / distance) * ring * 0.4;
          }

          const pointerPush = pointer.active
            ? Math.max(0, 1 - Math.hypot(pointer.x - lineCenterX, pointer.y - y) / 260)
            : 0;

          const xOffset = baseSwellX + rippleX;
          const yOffset = baseSwellY + rippleY + pointerPush * Math.sin(phaseShift * 2.8) * 0.7;
          const edgePadding = 14;
          const maxRightShift = viewportWidth - (textLeft + lineRenderWidth) - edgePadding;
          const maxLeftShift = textLeft - edgePadding;
          const safeXOffset = Math.max(-maxLeftShift, Math.min(maxRightShift, xOffset));
          const glow = 0.09 + Math.min(0.22, Math.abs(xOffset) / 90);

          return (
            <div
              key={`${index}-${line.width}`}
              style={{
                position: "absolute",
                left: textLeft,
                top: y,
                width: lineRenderWidth,
                height: LINE_HEIGHT,
                lineHeight: `${LINE_HEIGHT}px`,
                whiteSpace: "nowrap",
                overflow: "hidden",
                transform: `translate3d(${safeXOffset}px, ${yOffset}px, 0)`,
                color: "#0f172a",
                textShadow: `0 1px 0 rgba(255,255,255,0.95), 0 0 12px rgba(56, 189, 248, ${glow * 0.55})`,
                willChange: "transform",
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </section>
  );
}
