export interface User {
  id: string
  email: string
  emailAddress: string
  name: string
  username: string
  imageUrl: string
  image?: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}
