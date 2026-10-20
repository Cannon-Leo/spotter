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
      {/* Ambient glowing radial lights */}
      <div className={styles.ambientGlowLayer} />

      {/* Repeating animated diagonal striped canvas */}
      <div className={styles.stripedCanvas} />

      {/* Dynamic diagonal ribbon cluster cutting across the whole page */}
      <div className={styles.ribbonCluster}>
        <div className={`${styles.stripeBeam} ${styles.beam1}`} />
        <div className={`${styles.stripeBeam} ${styles.beam2}`} />
        <div className={`${styles.stripeBeam} ${styles.beam3}`} />
        <div className={`${styles.stripeBeam} ${styles.beam4}`} />
        <div className={`${styles.stripeBeam} ${styles.beam5}`} />
      </div>

      {/* High-fidelity SVG vector hatch lines for crisp resolution */}
      <svg
        className={styles.svgLayer}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="spotter-geo-stripes"
            width="80"
            height="80"
            patternTransform="rotate(-35 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="80"
              stroke="var(--color-secondary)"
              strokeWidth="0.75"
              strokeOpacity="0.12"
            />
            <line
              x1="40"
              y1="0"
              x2="40"
              y2="80"
              stroke="var(--color-primary)"
              strokeWidth="0.5"
              strokeDasharray="4 6"
              strokeOpacity="0.08"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#spotter-geo-stripes)" />
      </svg>
    </div>
  );
}
