import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'
import { db } from '@/lib'

export default async function (ctx: FunctionContext) {
  const { parentDocument, type } = ctx.query
  const userId = ctx.user.uid

  const userInfo = await db.collection('users').findOne({
    id: new ObjectId(userId),
  })

  const userEmail = userInfo?.emailAddress

  let documents

  if (type === 'share') {
    documents = await db
      .collection('documents')
      .find({
        parentDocument,
        isArchived: false,
        collaborators: {
          $elemMatch: { $eq: userEmail }, // 包含特定 userEmail
        },
        $expr: { $gte: [{ $size: '$collaborators' }, 2] }, // 协作者数量大于等于2
      })
      .toArray()
  } else if (type === 'private') {
    documents = await db
      .collection('documents')
      .find({
        parentDocument,
        isArchived: false,
        userId,
        collaborators: [userEmail],
      })
      .toArray()
  } else {
    return { error: 'The type parameter is invalid.' }
  }

  return documents
}
