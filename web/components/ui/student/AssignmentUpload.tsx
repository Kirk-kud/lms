'use client'

import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/ui/shared/Badge'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import ItemPreviewModal from '@/components/ui/shared/ItemPreviewModal'
import type { PreviewItem } from '@/components/ui/shared/ItemPreviewModal'
import type { ExpectedSubmissionType } from '@/lib/hooks/useAssignments'

export type SubmitPayload =
  | { kind: 'pdf_file'; file: File }
  | { kind: 'text'; submission_text: string }
  | { kind: 'link'; submission_link_url: string }

export interface AssignmentMaterialsBlock {
  instructionPdfSignedUrl?: string | null
  instructionPdfFileName?: string | null
  instructionLink?: string | null
  instructionText?: string | null
}

interface SubmissionSummary {
  submitted_at: Date
  kind: ExpectedSubmissionType
  file_display_name?: string | null
  pdf_signed_url?: string | null
  response_text?: string | null
  response_link?: string | null
}

interface AssignmentUploadProps {
  title: string
  description?: string
  materials?: AssignmentMaterialsBlock
  expectedSubmissionType?: ExpectedSubmissionType
  dueDate: Date
  isOverdue: boolean
  submission?: SubmissionSummary | null
  onSubmit: (payload: SubmitPayload) => Promise<void>
  uploadProgress?: number
}

export default function AssignmentUpload({
  title,
  description,
  materials,
  expectedSubmissionType = 'pdf_file',
  dueDate,
  isOverdue,
  submission,
  onSubmit,
  uploadProgress = 0,
}: AssignmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responseLink, setResponseLink] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [resubmitting, setResubmitting] = useState(false)
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasMaterials =
    (!!materials?.instructionPdfSignedUrl && !!materials?.instructionPdfFileName) ||
    !!materials?.instructionLink?.trim() ||
    !!materials?.instructionText?.trim()

  const isImageFile = (name: string) =>
    /\.(jpe?g|png|gif|webp)$/i.test(name)

  const dueDateLabel = (() => {
    if (isOverdue) return 'Overdue'
    const h = dueDate.getHours(), m = dueDate.getMinutes()
    const hasTime = h !== 0 || m !== 0
    const dateStr = format(dueDate, 'MMM d')
    return hasTime
      ? `Due ${dateStr} · ${format(dueDate, 'h:mm a')}`
      : `Due ${dateStr}`
  })()

  const submissionModeLabel =
    expectedSubmissionType === 'text'
      ? 'Written response'
      : expectedSubmissionType === 'link'
      ? 'Link submission'
      : 'PDF upload'

  const handleFileChange = (files: FileList | null) => {
    if (files?.[0]) setSelectedFile(files[0])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files)
  }

  const handleSubmitClick = async () => {
    if (expectedSubmissionType === 'pdf_file') {
      if (!selectedFile) return
      setIsUploading(true)
      try {
        await onSubmit({ kind: 'pdf_file', file: selectedFile })
        setSelectedFile(null)
        setResubmitting(false)
      } finally {
        setIsUploading(false)
      }
      return
    }

    if (expectedSubmissionType === 'text') {
      const trimmed = responseText.trim()
      if (!trimmed) return
      setIsUploading(true)
      try {
        await onSubmit({ kind: 'text', submission_text: trimmed })
        setResponseText('')
        setResubmitting(false)
      } finally {
        setIsUploading(false)
      }
      return
    }

    const linkTrimmed = responseLink.trim()
    if (!linkTrimmed) return
    setIsUploading(true)
    try {
      await onSubmit({ kind: 'link', submission_link_url: linkTrimmed })
      setResponseLink('')
      setResubmitting(false)
    } finally {
      setIsUploading(false)
    }
  }

  const canSubmit =
    expectedSubmissionType === 'pdf_file'
      ? !!selectedFile
      : expectedSubmissionType === 'text'
      ? !!responseText.trim()
      : !!responseLink.trim()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (submission && !resubmitting) {
    return (
      <>
        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-[#111]">{title}</h3>
                {description && (
                  <p className="text-[13px] text-[#6B7280] mt-1 leading-relaxed">{description}</p>
                )}
              </div>
              <StatusBadge variant="success" label="Submitted" />
            </div>

            <p className="text-[12px] text-[#9CA3AF]">
              Submitted {format(submission.submitted_at, 'MMM d, yyyy')} at{' '}
              {format(submission.submitted_at, 'h:mm a')}
              {isOverdue && <span className="ml-2 text-[#9CA3AF]">· Late</span>}
            </p>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3 w-full h-[3px] bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8B1A2F] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className="border-t border-[#F3F4F6] bg-[#FAFAFA] px-5 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0 text-[13px] text-[#6B7280] space-y-1">
              {submission.kind === 'pdf_file' &&
              submission.file_display_name ? (
                <button
                  type="button"
                  onClick={() => {
                    if (submission.pdf_signed_url) {
                      setPreviewItem({
                        title:
                          submission.file_display_name ?? 'Submission.pdf',
                        type: 'pdf',
                        content_url: submission.pdf_signed_url,
                        content_text: null,
                      })
                    }
                  }}
                  disabled={!submission.pdf_signed_url}
                  className="flex items-start gap-2 hover:text-[#111] disabled:opacity-50 transition-colors group text-left min-w-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="underline underline-offset-2 break-words">
                    {submission.file_display_name}
                  </span>
                </button>
              ) : null}

              {submission.kind === 'text' && submission.response_text ? (
                  <p className="text-[13px] text-[#111] whitespace-pre-wrap break-words max-h-[120px] overflow-y-auto leading-relaxed">
                    {submission.response_text}
                  </p>
              ) : null}

              {submission.kind === 'link' && submission.response_link && (
                <a
                  href={submission.response_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B1A2F] hover:underline block break-all"
                >
                  {submission.response_link}
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => setResubmitting(true)}
              className="shrink-0 h-8 px-4 text-[12px] font-semibold bg-[#8B1A2F] hover:bg-[#A52038] text-white rounded-lg transition-colors"
            >
              Resubmit
            </button>
          </div>
        </div>

        <ItemPreviewModal
          item={previewItem}
          open={previewItem !== null}
          onClose={() => setPreviewItem(null)}
        />
      </>
    )
  }

  return (
    <div className="space-y-4">
      {hasMaterials && (
        <div className="border border-[#E5E5E5] rounded-xl p-4 bg-[#F8F8F8] space-y-3">
          <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
            Materials from your tutors
          </p>
          {materials?.instructionPdfSignedUrl && materials.instructionPdfFileName && (
            isImageFile(materials.instructionPdfFileName) ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewItem({
                    title: materials.instructionPdfFileName!,
                    type: 'image',
                    content_url: materials.instructionPdfSignedUrl!,
                    content_text: null,
                  })}
                className="block w-full text-left group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={materials.instructionPdfSignedUrl}
                  alt={materials.instructionPdfFileName}
                  className="max-h-[180px] max-w-full rounded-lg border border-[#E5E5E5] object-contain bg-white group-hover:opacity-90 transition-opacity"
                />
                <p className="mt-1.5 text-[11px] text-[#9CA3AF] truncate">{materials.instructionPdfFileName}</p>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPreviewItem({
                    title: materials.instructionPdfFileName!,
                    type: 'pdf',
                    content_url: materials.instructionPdfSignedUrl!,
                    content_text: null,
                  })}
                className="flex items-center gap-2 text-[12px] text-[#111] hover:text-[#8B1A2F] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="underline underline-offset-2 truncate">{materials.instructionPdfFileName}</span>
              </button>
            )
          )}
          {materials?.instructionLink?.trim() && (
            <a
              href={materials.instructionLink.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-[12px] text-[#111] hover:text-[#8B1A2F]"
            >
              <span className="shrink-0 text-[10px] font-medium text-[#6B7280] mt-1">LINK</span>
              <span className="underline underline-offset-2 break-all">{materials.instructionLink.trim()}</span>
            </a>
          )}
          {materials?.instructionText?.trim() && (
            <div className="text-[13px] text-[#111] whitespace-pre-wrap border border-[#E5E5E5] rounded-lg p-3 bg-white max-h-[200px] overflow-y-auto leading-relaxed">
              {materials.instructionText.trim()}
            </div>
          )}
        </div>
      )}

      <div className="border border-[#E5E5E5] rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-[14px] font-medium text-[#111]">{title}</h3>
            {description && (
              <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <StatusBadge
              variant={isOverdue ? 'danger' : 'gray'}
              label={dueDateLabel}
            />
            <span className="text-[11px] text-[#9CA3AF] font-medium">{submissionModeLabel}</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={expectedSubmissionType === 'pdf_file' ? 'application/pdf' : undefined}
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files)}
        />

        {isOverdue && !submission && (
          <p className="text-[12px] text-[#6B7280] mb-3 leading-relaxed">
            This one passed. If you still want to submit, reach out to your tutor.
          </p>
        )}

        {expectedSubmissionType === 'pdf_file' && (
          <>
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="presentation"
                className="cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors"
                style={{
                  borderColor: isDragging ? '#8B1A2F' : '#E5E5E5',
                  backgroundColor: isDragging ? '#FDF8F9' : 'transparent',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-[13px] text-[#6B7280]">
                    Drop your PDF here, or <span className="text-[#111] underline">click to choose</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-[#F8F8F8] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="shrink-0 ml-3 text-[#9CA3AF] hover:text-[#111] transition-colors"
                  aria-label="Remove file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {expectedSubmissionType === 'text' && (
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows={10}
            placeholder="Write your response here…"
            className="w-full border border-[#E5E5E5] rounded-lg text-[13px] p-3 outline-none resize-y min-h-[160px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        )}

        {expectedSubmissionType === 'link' && (
          <input
            type="url"
            value={responseLink}
            onChange={(e) => setResponseLink(e.target.value)}
            placeholder="https://..."
            autoComplete="url"
            className="w-full h-9 px-3 text-[13px] border border-[#E5E5E5] rounded-lg outline-none"
          />
        )}

        {isUploading && uploadProgress > 0 && (
          <div className="mt-3 w-full h-[3px] bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#8B1A2F] transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {resubmitting && (
          <p className="text-[12px] text-[#6B7280] mt-4 mb-0 leading-relaxed">
            Replace what you handed in previously.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {resubmitting && (
            <button
              type="button"
              onClick={() => {
                setResubmitting(false)
                setSelectedFile(null)
                setResponseText('')
                setResponseLink('')
              }}
              className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={!canSubmit || isUploading}
            className="flex-1 h-9 text-[13px] font-medium bg-[#8B1A2F] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#A52038] transition-colors flex items-center justify-center gap-2"
          >
            {isUploading && <LoadingSpinner className="text-white" />}
            {isUploading ? 'Saving…' : resubmitting ? 'Resubmit' : 'Submit'}
          </button>
        </div>
      </div>

      <ItemPreviewModal
        item={previewItem}
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  )
}
