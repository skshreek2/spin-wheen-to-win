import { useMemo, useRef, useState, useEffect } from "react";
import { prepareWithSegments, layoutNextLine } from "@chenglou/pretext";

const LINE_HEIGHT = 24;
const VIEWPORT_WIDTH = 600;
const MIN_HEIGHT = 260;
const GAP = 16;
const INNER_PAD_X = 12;
const INNER_PAD_Y = 12;
const OBSTACLE_WIDTH = 64;
const OBSTACLE_HEIGHT = 64;

const TEXT =
  "Drag the box and observe how each line is laid out independently using layoutNextLine(). " +
  "This demo intentionally uses a longer paragraph so you can test reflow over many rows and positions. " +
  "When a row intersects the obstacle, the algorithm computes left and right available widths and places text in those zones. " +
  "When a row does not intersect, the line uses the full available width. " +
  "This makes it easier to validate obstacle avoidance, alignment, and drag behavior in real time.";

export default function PretextFlowDemo() {
  const [obstacle, setObstacle] = useState({
    x: 200,
    y: 60,
  });

  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const prepared = useMemo(() => prepareWithSegments(TEXT, "16px Inter"), []);

  const flow = useMemo(() => {
    let lines = [];
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 0;

    const obsLeft = obstacle.x;
    const obsRight = obstacle.x + OBSTACLE_WIDTH;
    const obsTop = obstacle.y;
    const obsBottom = obstacle.y + OBSTACLE_HEIGHT;

    const contentWidth = VIEWPORT_WIDTH - INNER_PAD_X * 2;
    const leftWidth = obsLeft - GAP;
    const rightWidth = contentWidth - obsRight - GAP;
    const rightX = obsRight + GAP;

    while (true) {
      const overlap = y < obsBottom && y + LINE_HEIGHT > obsTop;

      if (!overlap) {
        const line = layoutNextLine(prepared, cursor, contentWidth);
        if (!line) break;

        lines.push({
          text: line.text,
          x: INNER_PAD_X,
          y: y + INNER_PAD_Y,
          width: Math.floor(contentWidth),
        });
        cursor = line.end;
      } else {
        let placed = false;

        if (leftWidth > 50) {
          const left = layoutNextLine(prepared, cursor, leftWidth);
          if (left) {
            lines.push({
              text: left.text,
              x: INNER_PAD_X,
              y: y + INNER_PAD_Y,
              width: Math.floor(leftWidth),
            });
            cursor = left.end;
            placed = true;
          }
        }

        if (rightWidth > 50) {
          const right = layoutNextLine(prepared, cursor, rightWidth);
          if (right) {
            lines.push({
              text: right.text,
              x: INNER_PAD_X + rightX,
              y: y + INNER_PAD_Y,
              width: Math.floor(rightWidth),
            });
            cursor = right.end;
            placed = true;
          }
        }

        if (!placed) break;
      }

      y += LINE_HEIGHT;
    }

    return {
      lines,
      height: Math.max(MIN_HEIGHT, Math.max(y, obsBottom) + INNER_PAD_Y * 2 + 8),
    };
  }, [prepared, obstacle]);

  useEffect(() => {
    const move = (e) => {
      if (!dragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const contentWidth = VIEWPORT_WIDTH - INNER_PAD_X * 2;
      const nextX = e.clientX - rect.left - INNER_PAD_X - offsetRef.current.x;
      const nextY = e.clientY - rect.top - INNER_PAD_Y - offsetRef.current.y;

      setObstacle((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(contentWidth - OBSTACLE_WIDTH, Math.round(nextX))),
        y: Math.max(0, Math.round(nextY)),
      }));
    };

    const up = () => setDragging(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  const onDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left - INNER_PAD_X - obstacle.x,
      y: e.clientY - rect.top - INNER_PAD_Y - obstacle.y,
    };
    setDragging(true);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: VIEWPORT_WIDTH,
        border: "1px solid #ccc",
        height: flow.height,
        boxSizing: "border-box",
        font: "16px Inter, system-ui, sans-serif",
      }}
    >
      <div
        onPointerDown={onDown}
        style={{
          position: "absolute",
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
          transform: `translate(${INNER_PAD_X + obstacle.x}px, ${INNER_PAD_Y + obstacle.y}px)`,
          cursor: "grab",
        }}
      >
        <img
          src="/obstacle-fun.svg"
          alt="Obstacle"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      </div>

      {flow.lines.map((line, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            transform: `translate(${line.x}px, ${line.y}px)`,
            width: `${line.width}px`,
            height: LINE_HEIGHT,
            lineHeight: `${LINE_HEIGHT}px`,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}
