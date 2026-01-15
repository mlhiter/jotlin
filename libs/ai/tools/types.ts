// export interface DocumentToolContext {
//   chatThreadId: string
//   projectId?: string
//   workspaceId: string
//   userId: string
//   messageId: string
// }

// export interface ToolExecuteOptions {
//   context?: DocumentToolContext
// }

// export interface CreateDocumentArgs {
//   title: string
//   type: string
//   content: string
//   icon?: string
//   description?: string
// }

// export interface CreateDocumentResult {
//   success: boolean
//   documentId?: string
//   versionId?: string
//   title?: string
//   type?: string
//   message: string
// }

// export interface GetDocumentArgs {
//   documentId: string
// }

// export interface GetDocumentResult {
//   success: boolean
//   document?: {
//     id: string
//     title: string
//     content: string
//     type: string
//     currentVersion: number
//     lastEditedAt: Date
//   }
//   message: string
// }

// export interface UpdateDocumentArgs {
//   documentId: string
//   content: string
//   changeType: 'replace' | 'append' | 'prepend'
//   changeDescription?: string
// }

// export interface UpdateDocumentResult {
//   success: boolean
//   documentId?: string
//   versionId?: string
//   title?: string
//   changeType?: string
//   newVersion?: number
//   message: string
// }

// export interface ListDocumentsArgs {
//   documentType?: string
// }

// export interface ListDocumentsResult {
//   success: boolean
//   count?: number
//   documents?: Array<{
//     id: string
//     title: string
//     type: string
//     icon?: string
//     currentVersion: number
//     createdAt: Date
//     lastEditedAt: Date
//   }>
//   message: string
// }

// export type ToolCallResult =
//   | CreateDocumentResult
//   | GetDocumentResult
//   | UpdateDocumentResult
//   | ListDocumentsResult
