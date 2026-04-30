'use client'

import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/ui/shared/Badge'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'

interface SubmissionData {
  file_name: string
  submitted_at: Date
  signed_url: string
}

interface AssignmentUploadProps {
  title: string
  description?: string
  dueDate: Date
  isOverdue: boolean
  submission?: SubmissionData | null
  onSubmit: (file: File) => Promise<void>
  uploadProgress?: number
}

export default function AssignmentUpload({
  title,
  description,
  dueDate,
  isOverdue,
  submission,
  onSubmit,
  uploadProgress = 0,
}: AssignmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [resubmitting, setResubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSubmit = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    try {
      await onSubmit(selectedFile)
      setSelectedFile(null)
      setResubmitting(false)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (submission && !resubmitting) {
    return (
      <div className="border border-[#E5E5E5] rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-medium text-[#111]">{title}</h3>
            {description && (
              <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>
            )}
          </div>
          <StatusBadge variant="success" label="Submitted" />
        </div>

        <p className="text-[11px] text-[#9CA3AF]">
          Submitted {format(new Date(submission.submitted_at), 'MMM d, yyyy')} at {format(new Date(submission.submitted_at), 'h:mm a')}
        </p>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-3 w-full h-[3px] bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#8B1A2F] transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <div className="mt-3 flex items-center gap-4">
          {submission.signed_url && (
            <a
              href={submission.signed_url}
              download={submission.file_name}
              className="text-[12px] text-[#6B7280] hover:text-[#111] underline transition-colors truncate max-w-[200px]"
            >
              {submission.file_name}
            </a>
          )}
          <button
            onClick={() => setResubmitting(true)}
            className="text-[12px] text-[#9CA3AF] hover:text-[#111] transition-colors shrink-0"
          >
            Resubmit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#E5E5E5] rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-medium text-[#111]">{title}</h3>
          {description && (
            <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>
          )}
        </div>
        <StatusBadge
          variant={isOverdue ? 'danger' : 'gray'}
          label={isOverdue ? 'Overdue' : `Due ${format(dueDate, 'MMM d')}`}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files)}
      />

      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
              Drop PDF here or <span className="text-[#111] underline">browse</span>
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

      {isUploading && uploadProgress > 0 && (
        <div className="mt-3 w-full h-[3px] bg-[#F3F4F6] rounded-full overflow-hidden">
          <div className="h-full bg-[#8B1A2F] transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {resubmitting && (
          <button
            onClick={() => { setResubmitting(false); setSelectedFile(null) }}
            className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="flex-1 h-9 text-[13px] font-medium bg-[#111111] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#8B1A2F] transition-colors flex items-center justify-center gap-2"
        >
          {isUploading && <LoadingSpinner className="text-white" />}
          {isUploading ? 'Uploading...' : resubmitting ? 'Resubmit' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
