import React, { useState } from "react";
import { prepare, layout } from "@chenglou/pretext";

export default function DomnpreText() {
  const [domResult, setDomResult] = useState(null);
  const [pretextResult, setPretextResult] = useState(null);

  const [visibleItems, setVisibleItems] = useState([]);
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
    if (!hasShownTexts) {
      const list = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        text: sampleText,
      }));
      setVisibleItems(list);
      setHasShownTexts(true);
    }
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
    <div style={{ padding: 24, fontFamily: "Inter, sans-serif" }}>
      <h1>DOM vs Pretext</h1>
      <p style={{ maxWidth: 700 }}>
        Compare hidden DOM measurement with Pretext text layout.
      </p>

      <div style={{ marginTop: 16, maxWidth: width, font, lineHeight: 1.4 }}>
        {sampleText}
      </div>
      <div
        style={{ display: "flex", gap: 12, marginTop: 16, marginBottom: 24 }}
      >
        {/* <button onClick={measureWithDOM}>Measure with DOM</button> */}

        <button onClick={measureWithDOM} disabled={hasShownTexts}>
          {hasShownTexts ? "Already shown" : "Measure with DOM"}
        </button>
        <button onClick={measureWithPretext}>Measure with Pretext</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
          <h2>DOM result</h2>
          <pre>{JSON.stringify(domResult, null, 2)}</pre>
        </div>

        <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
          <h2>Pretext result</h2>
          <pre>{JSON.stringify(pretextResult, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
