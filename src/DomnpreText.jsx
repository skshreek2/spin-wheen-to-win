import React, { useState } from "react";
import { prepare, layout } from "@chenglou/pretext";

export default function DomnpreText() {
  const [domResult, setDomResult] = useState(null);
  const [pretextResult, setPretextResult] = useState(null);

  const [hasShownTexts, setHasShownTexts] = useState(false);

  const sampleText =
    "Pretext computes text layout without repeated DOM reads. ".repeat(8);
  const width = 300;
  const font = "16px Inter";

  const measureWithDOM = () => {
    const start = performance.now();

    let lastHeight = 0;

    for (let i = 0; i < 500; i++) {
      const el = document.createElement("div");
      el.textContent = sampleText;
      el.style.position = "absolute";
      el.style.visibility = "hidden";
      el.style.left = "-9999px";
      el.style.top = "0";
      el.style.width = `${width}px`;
      el.style.font = font;
      el.style.lineHeight = "1.4";
      el.style.whiteSpace = "normal";
      el.style.wordBreak = "break-word";

      document.body.appendChild(el);
      lastHeight = el.getBoundingClientRect().height;
      document.body.removeChild(el);
    }

    const end = performance.now();

    setDomResult({
      totalMs: (end - start).toFixed(2),
      lastHeight: lastHeight.toFixed(2),
      iterations: 500,
    });
    if (!hasShownTexts) setHasShownTexts(true);
  };

  const measureWithPretext = async () => {
    const prepareStart = performance.now();
    const prepared = await prepare(sampleText, font);
    const prepareEnd = performance.now();

    const layoutStart = performance.now();

    let measured = null;

    for (let i = 0; i < 500; i++) {
      measured = layout(prepared, width);
    }

    const layoutEnd = performance.now();

    setPretextResult({
      prepareMs: (prepareEnd - prepareStart).toFixed(2),
      totalLayoutMs: (layoutEnd - layoutStart).toFixed(4),
      lastHeight: measured.height.toFixed(2),
      lineCount: measured.lineCount,
      iterations: 500,
    });
  };

  return (
    <section className="perf-panel">
      <h2>Performance Test 1: DOM vs Pretext</h2>
      <p className="perf-summary">
        Compare hidden DOM measurement with Pretext text layout.
      </p>

      <div className="perf-sample" style={{ maxWidth: width, font, lineHeight: 1.4 }}>
        {sampleText}
      </div>
      <div className="perf-actions">
        <button className="perf-btn" onClick={measureWithDOM} disabled={hasShownTexts}>
          {hasShownTexts ? "Already shown" : "Measure with DOM"}
        </button>
        <button className="perf-btn perf-btn--alt" onClick={measureWithPretext}>
          Measure with Pretext
        </button>
      </div>

      <div className="perf-grid">
        <div className="perf-card">
          <h2>DOM result</h2>
          <pre>{JSON.stringify(domResult, null, 2)}</pre>
        </div>

        <div className="perf-card">
          <h2>Pretext result</h2>
          <pre>{JSON.stringify(pretextResult, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
}
