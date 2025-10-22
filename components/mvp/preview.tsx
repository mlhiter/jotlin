'use client'

import { AlertCircle, Loader2, RefreshCw, Terminal, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { getWebContainer, setCurrentProcess, killCurrentProcess } from '@/libs/sandbox/webcontainer'

import type { WebContainerProcess, FileSystemTree } from '@webcontainer/api'

interface PreviewProps {
  files: Record<string, string>
}

export function Preview({ files }: PreviewProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const initRef = useRef(false)
  const logsRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${time}] ${msg}`])
  }

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let cleanup = false
    let devProcess: WebContainerProcess | null = null

    async function start() {
      try {
        log('Checking environment...')

        if (!window.crossOriginIsolated) {
          throw new Error(
            'Cross-origin isolation is required for WebContainer. ' +
              'This feature requires special HTTP headers. ' +
              'Please contact the administrator.'
          )
        }

        log('✓ Environment check passed')

        log('Killing any existing server...')
        await killCurrentProcess()

        log('Getting WebContainer instance...')
        const wc = await getWebContainer()
        if (cleanup) return
        log('✓ WebContainer ready')

        log('Mounting file system...')
        const tree: FileSystemTree = {}
        Object.entries(files).forEach(([path, content]) => {
          const parts = path.split('/')
          let curr: FileSystemTree = tree
          for (let i = 0; i < parts.length - 1; i++) {
            if (!curr[parts[i]]) {
              curr[parts[i]] = { directory: {} }
            }
            const node = curr[parts[i]]
            if (node && 'directory' in node && node.directory) {
              curr = node.directory
            }
          }
          curr[parts[parts.length - 1]] = { file: { contents: content } }
        })

        await wc.mount(tree)
        if (cleanup) return
        log(`✓ Mounted ${Object.keys(files).length} files`)

        let serverUrl = ''
        wc.on('server-ready', (port, u) => {
          if (!cleanup) {
            log(`✓ Server started on port ${port}`)
            log(`✓ URL: ${u}`)
            serverUrl = u
          }
        })

        log('Installing dependencies...')
        const inst = await wc.spawn('npm', ['install'])

        inst.output.pipeTo(
          new WritableStream({
            write(data) {
              if (!cleanup) log(data)
            },
          })
        )

        const code = await inst.exit
        if (cleanup) return
        if (code !== 0) throw new Error('npm install failed')
        log('✓ Dependencies installed')

        log('Starting dev server...')
        devProcess = await wc.spawn('npm', ['run', 'dev'])
        setCurrentProcess(devProcess)

        let serverReady = false
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (!cleanup) {
                log(data)
                if (
                  !serverReady &&
                  serverUrl &&
                  (data.includes('Ready in') || data.includes('compiled successfully'))
                ) {
                  serverReady = true
                  log('🎉 Next.js fully started!')
                  log('✓ Loading preview')
                  setUrl(serverUrl)
                  setStatus('ready')
                }
              }
            },
          })
        )
      } catch (e) {
        if (!cleanup) {
          const msg = e instanceof Error ? e.message : 'Startup failed'
          log(`✗ Error: ${msg}`)
          setError(msg)
          setStatus('error')
        }
      }
    }

    start()

    return () => {
      cleanup = true
      initRef.current = false
      if (devProcess) {
        log('Cleaning up: killing dev server process...')
        killCurrentProcess().catch(() => {})
      }
    }
  }, [files])

  const handleRefresh = () => {
    if (iframeRef.current) {
      log('Manual iframe refresh')
      iframeRef.current.src = iframeRef.current.src
    }
  }

  if (status === 'error') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-sm text-red-600">{error}</p>
            {error.includes('Cross-origin isolation') && (
              <div className="mt-4 rounded-lg bg-muted p-4 text-left text-xs">
                <p className="font-semibold">Why this happened:</p>
                <p className="mt-2">
                  WebContainer requires special security headers (COEP/COOP) that were causing issues with the main
                  application.
                </p>
                <p className="mt-2">
                  We removed them to fix page refresh errors, but this means Preview won&apos;t work in the current
                  setup.
                </p>
              </div>
            )}
          </div>
        </div>
        {logs.length > 0 && (
          <div className="border-t bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Error Logs</span>
            </div>
            <div className="max-h-48 overflow-auto rounded border bg-background p-3 font-mono text-xs text-muted-foreground">
              {logs.map((l, i) => (
                <div key={i} className="py-0.5 leading-relaxed">
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">Starting up, please wait...</span>
        </div>
        {logs.length > 0 && (
          <div className="border-t bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Startup Logs</span>
              <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)}>
                <Terminal className="h-3 w-3" />
                <span className="ml-1 text-xs">{showLogs ? 'Hide' : 'Show'}</span>
              </Button>
            </div>
            {showLogs && (
              <div ref={logsRef} className="max-h-48 overflow-auto rounded border bg-background p-3 font-mono text-xs">
                {logs.map((l, i) => (
                  <div key={i} className="py-0.5 leading-relaxed text-muted-foreground">
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <span className="flex-1 truncate text-xs text-muted-foreground">{url || 'No URL'}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleRefresh} title="Refresh preview">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)} title="Show logs">
            <Terminal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="relative flex-1">
        {url ? (
          <iframe
            ref={iframeRef}
            key={url}
            src={url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups-to-escape-sandbox"
            className="h-full w-full border-0"
            onLoad={() => log('✓ iframe loaded successfully')}
            onError={() => log('✗ iframe loading failed')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Waiting for URL...</div>
        )}
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="border-t bg-muted/30">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold text-foreground">Logs</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLogs(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div ref={logsRef} className="max-h-64 overflow-auto p-3 font-mono text-xs">
            {logs.map((l, i) => (
              <div key={i} className="py-0.5 leading-relaxed text-muted-foreground">
                {l}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
