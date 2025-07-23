import { db } from '@/lib'
import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'

export default async function (ctx: FunctionContext) {
  const documentId = ctx.query.id
  const userId = ctx.user.uid

  const objectId = new ObjectId(documentId)

  const existingDocument = await db.collection('documents').findOne({
    id: objectId,
  })

  if (!existingDocument) {
    return { error: 'Not found' }
  }

  if (existingDocument.userId !== userId) {
    return { error: 'Unauthorized' }
  }

  const deleteNotice = await db.collection('documents').deleteOne({
    id: objectId,
  })

  if (!deleteNotice.deletedCount) {
    return { error: 'Failed to delete document ' }
  }

  return existingDocument
}
