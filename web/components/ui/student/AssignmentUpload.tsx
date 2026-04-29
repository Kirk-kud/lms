'use client'

import { useState } from 'react'
import { X, Download, Upload, CheckCircle2 } from 'lucide-react'
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
  getRootProps?: () => any
  getInputProps?: () => any
  StatusBadge?: React.ComponentType<{ variant: string; children: React.ReactNode }>
}

export default function AssignmentUpload({
  title,
  description,
  dueDate,
  isOverdue,
  submission,
  onSubmit,
  uploadProgress = 0,
  getRootProps,
  getInputProps,
  StatusBadge,
}: AssignmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: Date) => {
    const d = new Date(date)
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    return `${dateStr} at ${timeStr}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      setSelectedFile(files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleSubmit = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      await onSubmit(selectedFile)
      setSelectedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragEnter = () => {
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = () => {
    setIsDragging(false)
  }

  // Submitted mode
  if (submission) {
    return (
      <div className="w-full max-w-2xl">
        <div className="relative mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-medium" style={{ fontSize: '15px' }}>
                {title}
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Submitted</span>
            </div>
          </div>
        </div>

        {uploadProgress > 0 && (
          <div className="mb-4">
            <div className="w-full h-[3px] bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B1A2F] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {description && (
          <p className="mb-3 text-sm" style={{ fontSize: '13px', color: '#6B7280' }}>
            {description}
          </p>
        )}

        <div className="mb-4 text-xs" style={{ color: '#6B7280' }}>
          Submitted {formatDateTime(submission.submitted_at)}
        </div>

        <div className="flex gap-4">
          {submission.signed_url && (
            <a
              href={submission.signed_url}
              download={submission.file_name}
              className="text-xs underline"
              style={{ color: '#6B7280' }}
            >
              Download submission
            </a>
          )}
          <button
            className="text-xs text-gray-500 hover:text-gray-700"
            style={{ color: '#6B7280' }}
          >
            Resubmit
          </button>
        </div>
      </div>
    )
  }

  // Not submitted mode
  const dropzoneProps = getRootProps?.() || {}
  const inputProps = getInputProps?.() || {}

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium" style={{ fontSize: '15px' }}>
            {title}
          </h2>
          {StatusBadge ? (
            <StatusBadge variant={isOverdue ? 'destructive' : 'secondary'}>
              {isOverdue ? 'Overdue' : `Due ${formatDate(dueDate)}`}
            </StatusBadge>
          ) : (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isOverdue
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isOverdue ? 'Overdue' : `Due ${formatDate(dueDate)}`}
            </div>
          )}
        </div>
      </div>

      {description && (
        <p className="mb-3 text-sm" style={{ fontSize: '13px', color: '#6B7280' }}>
          {description}
        </p>
      )}

      <div
        {...dropzoneProps}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-4 cursor-pointer transition-all ${
          isDragging
            ? 'border-[1.5px] border-solid'
            : 'border-[1.5px] border-dashed border-[#E5E5E5]'
        }`}
        style={{
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          borderColor: isDragging ? '#8B1A2F' : '#E5E5E5',
          backgroundColor: isDragging ? '#FDF8F9' : 'transparent',
        }}
      >
        <input {...inputProps} onChange={(e) => handleFileChange(e.target.files)} />

        {!selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-5 h-5" style={{ color: '#9CA3AF' }} />
            <p className="text-sm" style={{ fontSize: '13px', color: '#6B7280' }}>
              Drop your PDF here
            </p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              or choose file
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {isUploading && uploadProgress > 0 && (
        <div className="mb-4">
          <div className="w-full h-[3px] bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B1A2F] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isUploading}
        className="w-full text-white font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          backgroundColor: '#000000',
          color: '#FFFFFF',
          height: '36px',
          borderRadius: '8px',
          fontSize: '13px',
        }}
      >
        {isUploading && <LoadingSpinner className="text-white" />}
        {isUploading ? 'Uploading...' : 'Submit Assignment'}
      </button>
    </div>
  )
}
