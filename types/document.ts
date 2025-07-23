export interface Doc {
  id: string
  title?: string
  userId?: string
  isArchived?: boolean
  isPublished?: boolean
  collaborators?: [string]
  parentDocument?: string
  content?: string
  icon?: string
  coverImage?: string
}
