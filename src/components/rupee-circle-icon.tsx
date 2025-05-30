
"use client";

import type React from 'react';

interface RupeeCircleIconProps extends React.SVGProps<SVGSVGElement> {
  amount: string | number;
}

export const RupeeCircleIcon: React.FC<RupeeCircleIconProps> = ({ amount, ...props }) => {
  // Adjust text properties based on amount length for better fit
  const amountStr = amount.toString();
  let fontSize = "9px";
  if (amountStr.length > 2) { // e.g., "100"
    fontSize = "7px";
  }

  return (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.5" // Default stroke width, can be overridden
      {...props} // Spread props to allow fill, className, stroke, etc. to be passed
      // Ensure fill and stroke are primarily driven by props for consistency
      fill={props.fill || "currentColor"}
      stroke={props.stroke || "currentColor"}
    >
      {/* Optional: A filled circle background if needed, transparent by default unless fill is specified */}
      {/* <circle cx="12" cy="12" r="11" fill={props.fill ? "transparent" : "hsl(var(--background))"} />  */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        fill="none" // Circle outline only
        stroke={props.stroke || "currentColor"} // Use passed stroke or default to currentColor
      />
      <text
        x="50%"
        y="50%"
        dy="0.35em" // vertically center
        textAnchor="middle"
        fill={props.fill || "currentColor"} // Text color from fill prop
        stroke="none" // No stroke for text
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        ₹{amountStr}
      </text>
    </svg>
  );
};
