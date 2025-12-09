export type FeedbackType = 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL' | 'COMPLAINT' | 'COMPLIMENT'

export interface FeedbackFormData {
  type: string
  title: string
  content: string
  email: string
}
