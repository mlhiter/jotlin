import { db } from '@/lib'
import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'

// schema
interface Document {
  title: string
  userId: string
  icon: string
  isArchived: boolean
  isPublished: boolean
  collaborators: [string]
  parentDocument?: ObjectId
  content?: string
  coverImage?: string
}

export default async function (ctx: FunctionContext) {
  const uid = ctx.user.uid
  const userInfo = await db.collection('users').findOne({
    id: new ObjectId(uid),
  })

  const userEmail = userInfo.emailAddress

  const { title, parentDocument } = ctx.body
  const document = {
    title,
    parentDocument,
    userId: uid,
    isArchived: false,
    isPublished: false,
    collaborators: [userEmail],
    icon: '',
    content: '',
    coverImage: '',
  }

  const documentCursor = await db.collection('documents').insertOne(document)

  if (documentCursor.insertedId) {
    return documentCursor.insertedId.toString()
  }

  return { error: 'Failed to create new document.' }
}
