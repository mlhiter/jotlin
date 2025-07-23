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

  // archive current document and its children document
  const recursiveRestore = async (documentId: string) => {
    const children = await db
      .collection('documents')
      .find({
        parentDocumentId: documentId,
        userId,
      })
      .toArray()
    for (const child of children) {
      await db.collection('documents').updateOne(
        {
          id: child.id,
        },
        {
          $set: { isArchived: false },
        }
      )
      const stringId = child.id.toString()
      await recursiveRestore(stringId)
    }
  }

  let parentArchived = false

  // if parentDocument has been archived,remove binding
  if (existingDocument.parentDocument) {
    const parentObjectId = new ObjectId(existingDocument.parentDocument)
    const parent = await db.collection('documents').findOne({
      id: parentObjectId,
    })
    if (parent.isArchived) {
      parentArchived = true
    }
  }

  await db.collection('documents').updateMany(
    {
      id: objectId,
    },
    {
      $set: {
        isArchived: false,
      },
    }
  )

  if (parentArchived) {
    await db.collection('documents').updateMany(
      {
        id: objectId,
      },
      {
        $set: {
          parentDocument: undefined,
        },
      }
    )
  }

  recursiveRestore(documentId)

  const updatedDocument = await db.collection('documents').findOne({
    id: objectId,
  })

  return updatedDocument
}
