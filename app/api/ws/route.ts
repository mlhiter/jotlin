import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { WebSocketServer } from 'ws'
import * as map from 'lib0/map'

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const pingTimeout = 30000

// Map from topic-name to set of subscribed clients
const topics = new Map()

const send = (conn: WebSocket, message: any) => {
  if (
    conn.readyState !== wsReadyStateConnecting &&
    conn.readyState !== wsReadyStateOpen
  ) {
    conn.close()
  }
  try {
    conn.send(JSON.stringify(message))
  } catch (e) {
    conn.close()
  }
}

const onconnection = (conn: WebSocket) => {
  const subscribedTopics = new Set<string>()
  let closed = false
  let pongReceived = true

  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      conn.close()
      clearInterval(pingInterval)
    } else {
      pongReceived = false
      try {
        conn.send('ping')
      } catch (e) {
        conn.close()
      }
    }
  }, pingTimeout)

  conn.addEventListener('message', (event) => {
    if (event.data === 'pong') {
      pongReceived = true
      return
    }

    let message
    try {
      message = JSON.parse(event.data.toString())
    } catch (e) {
      return
    }

    if (message && message.type && !closed) {
      switch (message.type) {
        case 'subscribe':
          ;(message.topics || []).forEach((topicName: string) => {
            if (typeof topicName === 'string') {
              // Add conn to topic
              const topic = map.setIfUndefined(
                topics,
                topicName,
                () => new Set()
              )
              topic.add(conn)
              // Add topic to conn
              subscribedTopics.add(topicName)
            }
          })
          break
        case 'unsubscribe':
          ;(message.topics || []).forEach((topicName: string) => {
            const subs = topics.get(topicName)
            if (subs) {
              subs.delete(conn)
            }
          })
          break
        case 'publish':
          if (message.topic) {
            const receivers = topics.get(message.topic)
            if (receivers) {
              message.clients = receivers.size
              receivers.forEach((receiver: WebSocket) =>
                send(receiver, message)
              )
            }
          }
          break
      }
    }
  })

  conn.addEventListener('close', () => {
    subscribedTopics.forEach((topicName) => {
      const subs = topics.get(topicName) || new Set()
      subs.delete(conn)
      if (subs.size === 0) {
        topics.delete(topicName)
      }
    })
    subscribedTopics.clear()
    closed = true
    clearInterval(pingInterval)
  })
}

let wss: WebSocketServer | null = null

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!wss) {
    wss = new WebSocketServer({
      port: parseInt(process.env.WS_PORT || '3001'),
      path: '/api/ws',
    })
    wss.on('connection', onconnection)
  }

  return new NextResponse(null, {
    status: 101,
    headers: {
      Upgrade: 'websocket',
      Connection: 'Upgrade',
    },
  })
}
