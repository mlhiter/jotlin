export interface Invitation {
  id: string
  documentId: string
  userEmail: string
  collaboratorEmail: string
  isAccepted: boolean
  isReplied: boolean
  isValid: boolean
}
