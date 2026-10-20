import React from 'react';

interface SpotterLogoProps {
  size?: number;
  className?: string;
}

export default function SpotterLogo({ size = 36, className }: SpotterLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', borderRadius: '6px', flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="6" fill="var(--color-secondary)" />
      <text
        x="50%"
        y="54%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-on-secondary)"
        fontFamily="var(--typography-display-large-font-family)"
        fontWeight="800"
        fontSize={Math.round(size * 0.58)}
      >
        S
      </text>
    </svg>
  );
}

