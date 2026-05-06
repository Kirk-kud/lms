'use client'

import { useState } from 'react'
import { FileChip } from '../shared/FileChip'

interface Item {
  id: string
  module_id: string
  title: string
  type: 'pdf' | 'link' | 'video' | 'text'
  content_url: string | null
  content_text: string | null
  order_index: number
  created_at: string
}

interface ModuleCardProps {
  title: string
  items: Item[]
  mode: 'admin' | 'student'
  completedItems?: string[]
  onAddItem?: () => void
  onDeleteItem?: (id: string) => void
  onEditItem?: (item: Item) => void
  onRenameModule?: () => void
  onDeleteModule?: () => void
  onItemClick: (item: Item) => void
}

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function ModuleCard({
  title,
  items,
  mode,
  completedItems = [],
  onAddItem,
  onDeleteItem,
  onEditItem,
  onRenameModule,
  onDeleteModule,
  onItemClick,
}: ModuleCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const completedCount = completedItems.length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="border border-[#E5E5E5] rounded-xl p-5 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[14px] font-medium text-[#111]">{title}</h3>
          <span className="text-[11px] text-[#9CA3AF]">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {mode === 'admin' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onAddItem}
              className="h-7 px-3 text-[12px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors"
            >
              Add item
            </button>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v) }}
                className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#111] hover:bg-[#F8F8F8] rounded-lg transition-colors"
                aria-label="Module actions"
              >
                <DotsIcon />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#E5E5E5] rounded-lg z-20 overflow-hidden">
                    <button
                      onClick={(e) => { e.stopPropagation(); onRenameModule?.(); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-[#111] hover:bg-[#F8F8F8] transition-colors"
                    >
                      Rename
                    </button>
                    <div className="border-t border-[#F3F4F6]" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteModule?.(); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-[#991B1B] hover:bg-red-50 transition-colors"
                    >
                      Delete module
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="mt-3 divide-y divide-[#F3F4F6]">
          {items.map((item) => {
            const isCompleted = completedItems.includes(item.id)
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onItemClick(item)}
                onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
                className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-[#FAFAFA] -mx-5 px-5 transition-colors group first:mt-2 cursor-pointer"
              >
                <FileChip type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] truncate ${isCompleted ? 'text-[#9CA3AF]' : 'text-[#111]'}`}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted && mode === 'student' && <CheckIcon />}
                  {(item.type === 'link' || item.type === 'video') && (
                    <span className="text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors">
                      <ExternalIcon />
                    </span>
                  )}
                  {item.type === 'pdf' && (
                    <span className="text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors">
                      <DownloadIcon />
                    </span>
                  )}
                  {mode === 'admin' && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditItem?.(item) }}
                        className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#111] transition-colors"
                        aria-label="Edit item"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteItem?.(item.id) }}
                        className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#991B1B] transition-colors"
                        aria-label="Delete item"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Student progress */}
      {mode === 'student' && totalCount > 0 && (
        <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[#9CA3AF]">{completedCount} of {totalCount} viewed</span>
            <span className="text-[11px] text-[#9CA3AF]">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full bg-[#F3F4F6] rounded-full h-[3px] overflow-hidden">
            <div
              className="h-full bg-[#8B1A2F] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
