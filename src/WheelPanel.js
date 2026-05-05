import React from "react";

import {
  ADD_PAYEE,
  IMPS,
  MANAGE_PAYEE,
  NEFT_TRANSFER,
  RTGS,
  UPI_TRANSFER,
  WHEEL_ITEMS,
  SEGMENT_ANGLE,
  LABEL_START_ANGLE,
} from "../constants";

const ITEM_ICONS = {
  [UPI_TRANSFER]: "📱",
  [NEFT_TRANSFER]: "🏦",
  [ADD_PAYEE]: "➕",
  [MANAGE_PAYEE]: "🛠️",
  [IMPS]: "⚡",
  [RTGS]: "💸",
};
export function WheelPanel({ wheelStyle, onSpinEnd, isSpinning }) {
  return (
    // <div className="wheel-panel">
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
    // </div>
  );
}
