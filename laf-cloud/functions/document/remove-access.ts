import { db } from '@/lib'
import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'

export default async function (ctx: FunctionContext) {
  const { documentId, collaboratorEmail } = ctx.body

  const existingInvitation = await db.collection('invitations').findOne({
    collaboratorEmail,
    isAccepted: true,
    documentId,
  })

  if (!existingInvitation || !existingInvitation.isValid) {
    return { error: 'Invitation not found' }
  }

  let afterRemovedCollaborators

  // recursive remove current document's children document's collaborators
  const recursiveRemove = async (documentId: string) => {
    const children = await db
      .collection('documents')
      .find({
        parentDocument: documentId,
      })
      .toArray()

    for (let child of children) {
      afterRemovedCollaborators = child.collaborators.filter(
        (collaborator) => collaborator !== collaboratorEmail
      )

      await db.collection('documents').updateOne(
        {
          id: child.id,
        },
        {
          $set: {
            collaborators: afterRemovedCollaborators,
          },
        }
      )
      const stringId = child.id.toString()
      await recursiveRemove(stringId)
    }
  }

  const objectdocumentId = new ObjectId(documentId)
  const document = await db.collection('documents').findOne({
    id: objectdocumentId,
  })
  afterRemovedCollaborators = document.collaborators.filter(
    (collaborator) => collaborator !== collaboratorEmail
  )
  const removeNotice = await db.collection('documents').updateOne(
    {
      id: objectdocumentId,
    },
    {
      $set: {
        collaborators: afterRemovedCollaborators,
      },
    }
  )

  if (!removeNotice.acknowledged) {
    return { error: 'Failed to remove access.' }
  }

  recursiveRemove(documentId)

  const deleteInvitationNotice = await db.collection('invitations').updateOne(
    {
      collaboratorEmail,
      isAccepted: true,
      documentId,
    },
    {
      $set: { isValid: false },
    }
  )

  if (!deleteInvitationNotice.acknowledged) {
    return { error: 'Failed to delete invitation' }
  }

  return { msg: 'ok' }
}
