export interface MvpData {
  id: string
  chatId: string
  sandboxId: string
  previewUrl: string
  files: Record<string, string>
  requirementSnapshot: string
  status: 'running' | 'stopped' | 'error'
  createdAt: string
  updatedAt: string
}

export interface GenerateMvpRequest {
  requirements: string
  chatId: string
}

export interface GenerateMvpResponse {
  sandboxId: string
  url: string
  files: Record<string, string>
}
