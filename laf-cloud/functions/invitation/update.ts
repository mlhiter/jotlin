import { db } from '@/lib'
import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'

export default async function (ctx: FunctionContext) {
  const { id, isAccepted } = ctx.body
  const userId = ctx.user.uid

  // if there is one invitation which is not replied
  const existingInvitation = await db.collection('invitations').findOne({
    id: new ObjectId(id),
  })

  if (!existingInvitation) {
    return { error: 'Invitation is not found.' }
  }

  const documentId = existingInvitation.documentId

  const user = await db.collection('users').findOne({
    id: new ObjectId(userId),
  })

  // you are invited,so is collaboratorEmail
  if (existingInvitation.collaboratorEmail !== user.emailAddress) {
    return { error: 'Unauthorized' }
  }

  const invitationNotice = await db.collection('invitations').updateOne(
    { id: new ObjectId(id) },
    {
      $set: {
        isReplied: true,
        isAccepted,
      },
    }
  )

  if (!invitationNotice.acknowledged) {
    return { error: 'Failed to update invitation.' }
  }

  // update document
  const recursiveUpdate = async (documentId: string) => {
    const children = await db
      .collection('documents')
      .find({
        parentDocument: documentId,
      })
      .toArray()
    for (const child of children) {
      await db.collection('documents').updateOne(
        { id: child.id },
        {
          $set: {
            collaborators: [...child.collaborators, user.emailAddress],
          },
        }
      )
      const stringId = child.id.toString()
      await recursiveUpdate(stringId)
    }
  }

  const document = await db.collection('documents').findOne({
    id: new ObjectId(documentId),
  })

  const updateCollaborators = [...document.collaborators, user.emailAddress]

  const updateDocumentNotice = await db.collection('documents').updateOne(
    { id: new ObjectId(documentId) },
    {
      $set: {
        collaborators: updateCollaborators,
      },
    }
  )

  if (!updateDocumentNotice) {
    return { error: 'Failed to update Document about collaborators' }
  }

  recursiveUpdate(documentId)

  const updatedInvitation = await db.collection('invitations').findOne({
    id: new ObjectId(id),
  })

  return updatedInvitation
}
