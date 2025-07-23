import { db } from '@/lib'
import { FunctionContext } from '@lafjs/cloud'
import { ObjectId } from 'mongodb'

export default async function (ctx: FunctionContext) {
  const uid = ctx.user.uid

  const objectId = new ObjectId(uid)

  const userInfo = await db.collection('users').findOne({
    id: objectId,
  })

  return userInfo
}
