'use client'

import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronRight, File } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/libs/utils/utils'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

interface TreeNodeInternal {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: Record<string, TreeNodeInternal>
}

interface FileTreeProps {
  files: Record<string, string>
  selectedFile: string
  onFileSelect: (path: string) => void
}

function buildFileTree(filePaths: string[]): FileNode[] {
  const root: Record<string, TreeNodeInternal> = {}

  filePaths.forEach((path) => {
    const parts = path.split('/')
    let current = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      const currentPath = parts.slice(0, index + 1).join('/')

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : {},
        }
      }

      if (!isFile && current[part].children) {
        current = current[part].children
      }
    })
  })

  const convertToArray = (nodes: Record<string, TreeNodeInternal>): FileNode[] => {
    return Object.values(nodes)
      .map((node) => ({
        ...node,
        children: node.children ? convertToArray(node.children) : undefined,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }

  return convertToArray(root)
}

function TreeNode({
  node,
  selectedFile,
  onFileSelect,
  depth = 0,
}: {
  node: FileNode
  selectedFile: string
  onFileSelect: (path: string) => void
  depth?: number
}) {
  const [isOpen, setIsOpen] = useState(true)
  const isSelected = selectedFile === node.path
  const hasChildren = node.children && node.children.length > 0

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onFileSelect(node.path)}
        className={cn(
          'group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-all',
          'hover:bg-accent',
          isSelected && 'bg-muted'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        title={node.path}>
        <File className="h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate text-sm">{node.name}</span>
      </button>
    )
  }

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Collapsible.Trigger asChild>
        <button
          className={cn(
            'group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-all',
            'hover:bg-accent'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}>
          <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-90')} />
          <span className="truncate text-sm">{node.name}</span>
        </button>
      </Collapsible.Trigger>

      {hasChildren && (
        <Collapsible.Content className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="space-y-0.5 py-0.5">
            {node.children!.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        </Collapsible.Content>
      )}
    </Collapsible.Root>
  )
}

export function FileTree({ files, selectedFile, onFileSelect }: FileTreeProps) {
  const fileTree = buildFileTree(Object.keys(files))

  return (
    <div className="min-w-0 space-y-0.5 p-2">
      {fileTree.map((node) => (
        <TreeNode key={node.path} node={node} selectedFile={selectedFile} onFileSelect={onFileSelect} />
      ))}
    </div>
  )
}
