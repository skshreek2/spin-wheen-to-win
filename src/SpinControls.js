// components/SpinWheel/SpinControls.jsx
import React from "react";

export function ModeSelector({ selectionMode, onModeChange }) {
  return (
    <section className="mode-selector" aria-label="Selection Mode">
      <label className="mode-option">
        <input
          type="radio"
          name="selection-mode"
          value="performance"
          checked={selectionMode === "performance"}
          onChange={(e) => onModeChange(e.target.value)}
        />
        <span>Performance</span>
      </label>
      <label className="mode-option">
        <input
          type="radio"
          name="selection-mode"
          value="user-experiance"
          checked={selectionMode === "user-experiance"}
          onChange={(e) => onModeChange(e.target.value)}
        />
        <span>User Experiance</span>
      </label>
    </section>
  );
}

export function SpinButton({ isSpinning, onSpin }) {
  return (
    <button className="spin-btn" onClick={onSpin} disabled={isSpinning}>
      {isSpinning ? "Spinning..." : "Spin Now"}
    </button>
  );
}
