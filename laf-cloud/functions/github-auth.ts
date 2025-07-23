import cloud from '@lafjs/cloud'
import { db } from '@/lib'

// NOTE：这个接口写的不规范，但是不影响使用
interface JsonRes {
  access_token: string
  error?: string
  error_description?: string
}

interface JsonUserData {
  name: string
  email: string
  avatar_url: string
  [key: string]: string
}

export default async function (ctx: FunctionContext) {
  const params = {
    client_id: process.env.GITHUB_ID,
    client_secret: process.env.GITHUB_SECRET,
    code: ctx.query.code,
  }

  // 请求github获取access_token
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=utf-8',
    },
  })

  if (!res.ok) {
    return { error: 'Failed to request access_token' }
  }

  const jsonRes = (await res.json()) as JsonRes

  // code error
  if (jsonRes.error) {
    return { error: jsonRes.error_description }
  }

  const github_access_token = jsonRes.access_token

  // 通过access_token获取用户信息
  const userData = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${github_access_token}` },
  })

  const jsonUserData = (await userData.json()) as JsonUserData

  // 用户信息写入数据库：name，email，avatar_url

  const existingUser = await db.collection('users').findOne({
    emailAddress: jsonUserData.email,
  })

  let insertedId: any

  // 如果没有该用户则新建用户
  if (!existingUser) {
    const insertedInfo = await db.collection('users').insertOne({
      username: jsonUserData.name,
      imageUrl: jsonUserData.avatar_url,
      emailAddress: jsonUserData.email,
      created_at: new Date(),
    })
    insertedId = insertedInfo.insertedId.toString()
  } else {
    insertedId = existingUser.id
  }

  // 写入成功后返回用户id制成的jwt token
  if (!insertedId) {
    return { error: 'Fail to get user.' }
  }

  const payload = {
    uid: insertedId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  }

  const access_token = cloud.getToken(payload)

  return { uid: insertedId, access_token }
}
