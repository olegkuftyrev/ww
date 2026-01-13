import * as React from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { Upload, File } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfDropzoneProps {
  onFileSelect: (file: File) => void
  className?: string
  disabled?: boolean
}

export function PdfDropzone({ onFileSelect, className, disabled }: PdfDropzoneProps) {
  const accept: Accept = {
    'application/pdf': ['.pdf'],
  }

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept,
    disabled,
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
  })

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps({
          className: cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            disabled && 'pointer-events-none opacity-50'
          ),
        })}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? 'Drop PDF file here' : 'Drag & drop a PDF file here'}
        </p>
        <p className="text-sm text-muted-foreground">or click to select a PDF file</p>
      </div>

      {acceptedFiles.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{acceptedFiles[0].name}</span>
        </div>
      )}
    </div>
  )
}
