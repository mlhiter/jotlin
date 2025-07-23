import { ObjectId } from 'mongodb'
import { db } from '@/lib'

export default async function (ctx: FunctionContext, next: Function) {
  if (ctx.request.url.startsWith('/github-auth')) {
    return await next(ctx)
  }

  // 获取数据库所有用户并检测是否有该用户
  if (ctx.user) {
    const objectId = new ObjectId(ctx.user.uid)
    const userExist = await db
      .collection('users')
      .find({ id: objectId })
      .toArray()

    if (userExist.length > 0) {
      return await next(ctx)
    }
  }

  ctx.response.status(403).send('禁止访问')
}
