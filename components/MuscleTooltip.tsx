'use client';

import { Html } from '@react-three/drei';
import { ACTIVATION_COLORS, type Activation } from '@/lib/materials';
import { labelFor } from '@/lib/muscleRegistry';

const ROLE_TEXT: Partial<Record<Activation, string>> = {
  primary: 'Primary',
  secondary: 'Secondary',
};

export default function MuscleTooltip({
  muscleId,
  activation,
  position = [0, 0.34, 0],
}: {
  muscleId: string;
  activation: Activation;
  position?: [number, number, number];
}) {
  const accent =
    activation === 'primary'
      ? ACTIVATION_COLORS.primary
      : activation === 'secondary'
        ? ACTIVATION_COLORS.secondary
        : 'rgba(140,190,230,0.75)';

  const role = ROLE_TEXT[activation];

  return (
    <Html position={position} center distanceFactor={4} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          whiteSpace: 'nowrap',
          background: 'rgba(4, 10, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${accent}`,
          borderRadius: 7,
          padding: '5px 11px',
          color: accent,
          fontFamily: 'var(--font-ui, Inter), system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          boxShadow:
            activation === 'primary' || activation === 'secondary'
              ? `0 0 14px ${accent}55`
              : 'none',
        }}
      >
        {labelFor(muscleId)}
        {role && (
          <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.12em' }}>{role}</span>
        )}
      </div>
    </Html>
  );
}
