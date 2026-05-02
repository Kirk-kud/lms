import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subText?: string;
  accentColor?: string; // retained for API compatibility, unused in visual
}

export function StatCard({ label, value, subText }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECE6E0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Crimson top accent */}
      <div style={{ height: '2px', backgroundColor: '#8B1A2F' }} />
      <div style={{ padding: '18px 20px' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: '#9C949A',
            margin: '0 0 8px 0',
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0A0A0B',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            margin: 0,
          }}
        >
          {value}
        </p>
        {subText && (
          <p
            style={{
              fontSize: '12px',
              color: '#9C949A',
              margin: '6px 0 0',
            }}
          >
            {subText}
          </p>
        )}
      </div>
    </div>
  );
}

interface StatCardGridProps {
  cards: Array<{
    label: string;
    value: string | number;
    subText?: string;
    accentColor?: string;
  }>;
}

export function StatCardGrid({ cards }: StatCardGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
      }}
    >
      {cards.map((card, index) => (
        <StatCard
          key={index}
          label={card.label}
          value={card.value}
          subText={card.subText}
          accentColor={card.accentColor}
        />
      ))}
    </div>
  );
}
