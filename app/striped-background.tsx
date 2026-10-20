import React from 'react';
import styles from './striped-background.module.css';

interface StripedBackgroundProps {
  variant?: 'default' | 'subtle';
}

export default function StripedBackground({ variant = 'default' }: StripedBackgroundProps) {
  const isSubtle = variant === 'subtle';

  return (
    <div
      className={`${styles.backgroundWrapper} ${isSubtle ? styles.subtleVariant : ''}`}
      aria-hidden="true"
    >
      {/* Layer 1: Tranquil Ambient Base Glow */}
      <div className={styles.ambientMutedTint} />

      {/* Layer 2: Continuous Flowing Diagonal Striped Texture Canvas */}
      <div className={styles.pinStripeField} />

      {/* Layer 3: Elegant Architectural Speed Ribbons Cutting Across Page */}
      <div className={styles.speedRibbonTrack}>
        <div className={`${styles.ribbonBand} ${styles.ribbonBand1}`} />
        <div className={`${styles.ribbonBand} ${styles.ribbonBand2}`} />
        <div className={`${styles.ribbonBand} ${styles.ribbonBand3}`} />
        <div className={`${styles.ribbonBand} ${styles.ribbonBand4}`} />
      </div>

      {/* Layer 4: Gentle Diagonal Light Sweep Sheen */}
      <div className={styles.lightSweepSheen} />

      {/* Layer 5: High-Precision Vector Striped Accent Lines */}
      <svg
        className={styles.vectorStripeLayer}
        viewBox="0 0 1440 1800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="cleanStripeGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.14" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          <pattern
            id="spotterLinearPinstripe"
            width="64"
            height="64"
            patternTransform="rotate(-30 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="64"
              stroke="var(--color-secondary)"
              strokeWidth="0.75"
              className={styles.svgLineBase}
            />
            <line
              x1="32"
              y1="0"
              x2="32"
              y2="64"
              stroke="var(--color-primary)"
              strokeWidth="0.5"
              strokeDasharray="4 6"
              className={styles.svgLineAccent}
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#spotterLinearPinstripe)" />

        {/* Dynamic Sweeping Diagonal Contour Bands */}
        <g className={styles.svgRibbonGroup}>
          <path
            d="M 1550 -50 L 50 1650"
            stroke="url(#cleanStripeGrad)"
            strokeWidth="1.5"
          />
          <path
            d="M 1600 0 L 100 1700"
            stroke="url(#cleanStripeGrad)"
            strokeWidth="0.75"
            strokeDasharray="8 8"
          />
          <path
            d="M 1660 60 L 160 1760"
            stroke="url(#cleanStripeGrad)"
            strokeWidth="2.5"
          />
          <path
            d="M 1720 120 L 220 1820"
            stroke="url(#cleanStripeGrad)"
            strokeWidth="0.75"
            strokeDasharray="4 6"
          />
        </g>
      </svg>
    </div>
  );
}
