import { NextRequest } from 'next/server'
import { eventBus } from '@/lib/event-bus'

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic'

const enc = new TextEncoder()
const sse = (data: unknown) => enc.encode(`data: ${JSON.stringify(data)}\n\n`)

export async function GET(req: NextRequest) {
  let unsubscribe: (() => void) | undefined
  let pingInterval: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      // Announce connection immediately so the client knows the stream is live
      controller.enqueue(sse({ event: 'connected', timestamp: Date.now() }))

      // Forward every broadcast event to this client
      unsubscribe = eventBus.subscribe(event => {
        try {
          controller.enqueue(sse(event))
        } catch {
          // Client already gone — cleanup handled by abort listener below
        }
      })

      // Keep-alive ping every 15 s (prevents proxy / load balancer timeouts)
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(sse({ event: 'ping' }))
        } catch {
          clearInterval(pingInterval)
        }
      }, 15_000)

      // Clean up when the client disconnects
      req.signal.addEventListener('abort', () => {
        unsubscribe?.()
        clearInterval(pingInterval)
        try { controller.close() } catch { /* already closed */ }
      })
    },

    cancel() {
      unsubscribe?.()
      clearInterval(pingInterval)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering for SSE proxies
    },
  })
}
