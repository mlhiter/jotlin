import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'
import { db } from '@/lib'

export default async function (ctx: FunctionContext) {
  const { id, ...rest } = ctx.body

  const objectId = new ObjectId(id)

  const existingDocument = await db.collection('documents').findOne({
    id: objectId,
  })

  if (!existingDocument) {
    return { error: 'Not found' }
  }

  // FIXME: 暂时不处理update认证
  // if (existingDocument.userId !== userId) {
  //   return { error: 'Unauthorized' }
  // }

  const updateNotice = await db.collection('documents').updateOne(
    {
      id: objectId,
    },
    {
      $set: { ...rest },
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
