import React from 'react';

export type ModuleItemType = 'pdf' | 'video' | 'link' | 'text';

export interface FileChipProps {
  type: ModuleItemType;
}

const LABELS: Record<ModuleItemType, string> = {
  pdf: 'PDF',
  video: 'VID',
  link: 'LNK',
  text: 'TXT',
};

export function FileChip({ type }: FileChipProps) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#F5E6EA] text-[10px] font-medium text-[#6B1222]">
      {LABELS[type]}
    </div>
  );
}
