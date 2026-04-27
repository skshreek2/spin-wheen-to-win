import { useMemo, useRef, useState } from "react";
import { layout, prepare } from "@chenglou/pretext";
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
const RESULT_PANEL_WIDTH = 620;
const RESULT_LINE_HEIGHT = 24;
const RESULT_LINE_COUNT = 10;
const RESULT_FADE_MS = 600;
const RESULT_DETAILS = {
  [UPI_TRANSFER]: UPIFullText,
  [NEFT_TRANSFER]: NEFTFullText,
  [ADD_PAYEE]: AddPayeeFullText,
  [MANAGE_PAYEE]: ManagePayeeFullText,
  [IMPS]: IMPSFullText,
  [RTGS]: RTGSFullText,
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
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedResultText, setDisplayedResultText] = useState(() =>
    buildLongResultText(""),
  );
  const [isResultVisible, setIsResultVisible] = useState(true);
  const fadeTimeoutRef = useRef(null);

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

  const preparedResult = useMemo(
    () =>
      prepare(displayedResultText, "500 16px Inter", {
        whiteSpace: "pre-wrap",
      }),
    [displayedResultText],
  );

  const resultMetrics = useMemo(
    () => layout(preparedResult, RESULT_PANEL_WIDTH, RESULT_LINE_HEIGHT),
    [preparedResult],
  );
  const textAreaRows = Math.min(20, Math.max(10, resultMetrics.lineCount + 2));

  return (
    <main className="app">
      <h1>Spin Wheel To Win</h1>

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
                    <span>{item}</span>
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
          <textarea
            id="result-text"
            readOnly
            rows={textAreaRows}
            value={displayedResultText}
            aria-live="polite"
            className={isResultVisible ? "result-text is-visible" : "result-text is-hidden"}
          />
        </div>
      </section>

      <section className="pretext-demo-section">
        <h2>@chenglou/pretext - Obstacle Reflow Demo</h2>
        <p>Drag the obstacle. Text reflows line-by-line via layoutNextLine().</p>
        <PretextFlowDemo />
      </section>

    </main>
  );
}

export default App;
