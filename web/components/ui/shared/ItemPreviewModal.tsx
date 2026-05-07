'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileChip } from './FileChip'

export interface PreviewItem {
  title: string
  type: 'pdf' | 'video' | 'link' | 'text'
  content_url: string | null
  content_text: string | null
}

interface ItemPreviewModalProps {
  item: PreviewItem | null
  open: boolean
  onClose: () => void
}

function ExternalLinkIcon() {
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

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

export default function ItemPreviewModal({ item, open, onClose }: ItemPreviewModalProps) {
  const [copied, setCopied] = useState(false)

  if (!item) return null

  const handleCopy = async () => {
    if (!item.content_text) return
    await navigator.clipboard.writeText(item.content_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderContent = () => {
    switch (item.type) {
      case 'pdf': {
        if (!item.content_url) {
          return <p className="text-[13px] text-[#6B7280]">No file available.</p>
        }
        return (
          <iframe src={item.content_url} className="w-full h-full border-none" title={item.title} />
        )
      }

      case 'video': {
        if (!item.content_url) {
          return <p className="text-[13px] text-[#6B7280]">No video available.</p>
        }
        const embedUrl = getYouTubeEmbedUrl(item.content_url) ?? getVimeoEmbedUrl(item.content_url)
        return (
          <div className="space-y-3">
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-[#E5E5E5] bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={item.title}
                />
              ) : (
                <video controls className="w-full h-full" src={item.content_url} />
              )}
            </div>
            <div className="flex justify-end">
              <a
                href={item.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 text-[13px] font-medium border border-[#E5E5E5] text-[#111] rounded-lg hover:bg-[#F8F8F8] transition-colors inline-flex items-center gap-2"
              >
                <ExternalLinkIcon />
                Open in new tab
              </a>
            </div>
          </div>
        )
      }

      case 'link': {
        return null
      }

      case 'text': {
        return (
          <div className="space-y-3">
            <div className="w-full max-h-[400px] overflow-y-auto rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4">
              <p className="text-[13px] text-[#111] leading-relaxed whitespace-pre-wrap">
                {item.content_text ?? 'No content available.'}
              </p>
            </div>
            {item.content_text && (
              <div className="flex justify-end">
                <button
                  onClick={handleCopy}
                  className="h-9 px-4 text-[13px] font-medium border border-[#E5E5E5] text-[#111] rounded-lg hover:bg-[#F8F8F8] transition-colors inline-flex items-center gap-2"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? 'Copied!' : 'Copy text'}
                </button>
              </div>
            )}
          </div>
        )
      }
    }
  }

  if (item.type === 'pdf' && item.content_url) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          style={{
            width: '95vw',
            maxWidth: '95vw',
            height: '92vh',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <DialogHeader
            style={{
              padding: '12px 16px',
              borderBottom: '0.5px solid #E5E5E5',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileChip type="pdf" />
              <DialogTitle className="text-[14px] font-medium truncate">{item.title}</DialogTitle>
            </div>
            <a
              href={item.content_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 h-8 px-3 text-[12px] font-medium bg-[#111] text-white rounded-md hover:bg-[#8B1A2F] transition-colors inline-flex items-center gap-1.5"
            >
              <DownloadIcon />
              Download
            </a>
          </DialogHeader>
          <div style={{ flex: 1, overflow: 'hidden', background: '#F8F8F8' }}>
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const maxWidth = item.type === 'video' ? 'max-w-3xl' : 'max-w-2xl'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <FileChip type={item.type} />
            <DialogTitle className="text-[15px] font-medium">{item.title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="mt-1">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
