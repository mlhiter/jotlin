'use client'

import Editor from '@monaco-editor/react'
import { useState } from 'react'

import { FileSelector } from './file-selector'

interface CodeEditorProps {
  files: Record<string, string>
  readOnly?: boolean
}

export function CodeEditor({ files, readOnly = true }: CodeEditorProps) {
  const fileList = Object.keys(files)
  const [currentFile, setCurrentFile] = useState(fileList[0] || 'app/page.tsx')

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return 'typescript'
    if (filename.endsWith('.jsx') || filename.endsWith('.js')) return 'javascript'
    if (filename.endsWith('.json')) return 'json'
    if (filename.endsWith('.css')) return 'css'
    if (filename.endsWith('.md')) return 'markdown'
    return 'plaintext'
  }

  return (
    <div className="flex h-full flex-col">
      <FileSelector files={fileList} currentFile={currentFile} onFileChange={setCurrentFile} />

      <Editor
        height="100%"
        language={getLanguage(currentFile)}
        value={files[currentFile] || ''}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />
    </div>
  )
}
