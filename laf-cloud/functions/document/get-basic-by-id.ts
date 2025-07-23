import { db } from '@/lib'
import { ObjectId } from 'mongodb'

export default async function (ctx: FunctionContext) {
  const documentId = ctx.query.id
  const objectId = new ObjectId(documentId)

  const document = await db.collection('documents').findOne({
    id: objectId,
  })

  if (!document) {
    return { error: 'Not found.' }
  }

  const { title, icon } = document

  return { title, icon }
}
