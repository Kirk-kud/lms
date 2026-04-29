import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  accentColor?: string;
}

export function StatCard({ label, value, accentColor }: StatCardProps) {
  return (
    <div className="bg-[#F8F8F8] rounded-lg p-4">
      <div
        className="text-[11px] text-[#9CA3AF] mb-1 uppercase"
        style={{ letterSpacing: '0.06em' }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-medium"
        style={{ color: accentColor || '#111111' }}
      >
        {value}
      </div>
    </div>
  );
}

interface StatCardGridProps {
  cards: Array<{
    label: string;
    value: string | number;
    accentColor?: string;
  }>;
}

export function StatCardGrid({ cards }: StatCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px]">
      {cards.map((card, index) => (
        <StatCard
          key={index}
          label={card.label}
          value={card.value}
          accentColor={card.accentColor}
        />
      ))}
    </div>
  );
}
