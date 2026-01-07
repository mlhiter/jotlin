'use client'

import { useParams } from 'next/navigation'
import { Trash2 } from 'lucide-react'

import { useTrash } from '@/hooks/use-trash'
import { TrashProjectItem } from '@/components/trash/trash-project-item'
import { TrashDocumentItem } from '@/components/trash/trash-document-item'
import { TrashChatThreadItem } from '@/components/trash/trash-chat-thread-item'
import { Skeleton } from '@/components/ui/skeleton'

export default function TrashPage() {
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  const { data, isPending } = useTrash(workspaceId)

  const projects = data?.projects ?? []
  const documents = data?.documents ?? []
  const chatThreads = data?.chatThreads ?? []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <Trash2 className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Trash</h1>
            <p className="text-sm text-muted-foreground">
              Items in trash can be restored or permanently deleted
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isPending ? (
          // Loading skeleton
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : projects.length === 0 && documents.length === 0 && chatThreads.length === 0 ? (
          // Empty state
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">Trash is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Deleted items will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Projects Section */}
            {projects.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Projects ({projects.length})</h2>
                <div className="space-y-3">
                  {projects.map((project) => (
                    <TrashProjectItem key={project.id} project={project} workspaceId={workspaceId} />
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {documents.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Documents ({documents.length})</h2>
                <div className="space-y-3">
                  {documents.map((document) => (
                    <TrashDocumentItem key={document.id} document={document} workspaceId={workspaceId} />
                  ))}
                </div>
              </div>
            )}

            {/* Chat Threads Section */}
            {chatThreads.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Chat Threads ({chatThreads.length})</h2>
                <div className="space-y-3">
                  {chatThreads.map((chatThread) => (
                    <TrashChatThreadItem key={chatThread.id} chatThread={chatThread} workspaceId={workspaceId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
