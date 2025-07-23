import { db } from '@/lib'
import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'

export default async function (ctx: FunctionContext) {
  const id = ctx.query.id
  const userId = ctx.user.uid

  const objectId = new ObjectId(id)

  const existingDocument = await db.collection('documents').findOne({
    id: objectId,
  })

  if (!existingDocument) {
    return { error: 'Not found' }
  }

  if (existingDocument.userId !== userId) {
    return { error: 'Unauthorized' }
  }

  const updateNotice = await db.collection('documents').updateOne(
    {
      id: objectId,
    },
    {
      $set: { icon: undefined },
    }
  )

  if (!updateNotice.acknowledged) {
    return { error: 'Failed to update document.' }
  }

  const updatedDocument = await db.collection('documents').findOne({
    id: objectId,
  })

  return updatedDocument
}
