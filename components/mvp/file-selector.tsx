'use client'

interface FileSelectorProps {
  files: string[]
  currentFile: string
  onFileChange: (file: string) => void
}

export function FileSelector({ files, currentFile, onFileChange }: FileSelectorProps) {
  return (
    <div className="border-b border-border bg-muted/30 p-2">
      <select
        value={currentFile}
        onChange={(e) => onFileChange(e.target.value)}
        className="w-full rounded border border-border bg-background px-2 py-1 text-sm">
        {files.map((file) => (
          <option key={file} value={file}>
            {file}
          </option>
        ))}
      </select>
    </div>
  )
}
