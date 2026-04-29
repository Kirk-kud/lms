'use client';

import React, { useState } from 'react';
import { FileChip } from '../shared/FileChip';

interface Item {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video' | 'text';
  content_url: string;
  created_at: string;
}

interface ModuleCardProps {
  title: string;
  items: Item[];
  mode: 'tutor' | 'student';
  completedItems?: string[];
  onAddItem?: () => void;
  onDeleteItem?: (id: string) => void;
  onRenameModule?: () => void;
  onDeleteModule?: () => void;
  onItemClick: (item: Item) => void;
}

const MenuIcon: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="p-1 hover:bg-gray-100 rounded transition-colors"
    aria-label="Module menu"
  >
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="currentColor">
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  </button>
);

const ExternalLinkIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function ModuleCard({
  title,
  items,
  mode,
  completedItems = [],
  onAddItem,
  onDeleteItem,
  onRenameModule,
  onDeleteModule,
  onItemClick,
}: ModuleCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const completedCount = completedItems.length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteItem?.(itemId);
  };

  const getItemIcon = (type: string) => {
    if (type === 'link' || type === 'video') {
      return <ExternalLinkIcon />;
    }
    if (type === 'pdf') {
      return <DownloadIcon />;
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {mode === 'tutor' && (
          <div className="flex items-center gap-2 relative">
            <button
              onClick={onAddItem}
              className="text-xs px-3 py-1 border border-[#E5E5E5] bg-white rounded hover:bg-gray-50 transition-colors"
            >
              Add item
            </button>
            <MenuIcon onClick={handleMenuClick} />

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E5E5] rounded shadow-lg z-10 min-w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameModule?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteModule?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="mt-3 divide-y divide-[#F3F4F6]">
        {items.map((item, index) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredItemId(item.id)}
            onMouseLeave={() => setHoveredItemId(null)}
            className={`flex items-center gap-2.5 py-2 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded transition-colors ${
              index === 0 ? 'pt-3' : ''
            }`}
            onClick={() => onItemClick(item)}
          >
            <FileChip type={item.type} />

            <div className="flex-1">
              <p className="text-sm text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getItemIcon(item.type) && (
                <span className="text-gray-600">{getItemIcon(item.type)}</span>
              )}

              {mode === 'tutor' && hoveredItemId === item.id && (
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                  aria-label="Delete item"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar (Student Mode) */}
      {mode === 'student' && (
        <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
          <div className="w-full bg-gray-200 rounded-full h-[3px] overflow-hidden">
            <div
              className="bg-[#722F37] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {completedCount} of {totalCount} complete
          </p>
        </div>
      )}
    </div>
  );
}
