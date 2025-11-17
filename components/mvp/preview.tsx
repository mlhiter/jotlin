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

  // Block window.open calls to prevent browser extensions from opening new tabs
  useEffect(() => {
    const originalOpen = window.open
    window.open = function (...args) {
      const url = args[0]?.toString() || ''

      // Block WebContainer URLs to prevent auto-opening by extensions
      if (url.includes('webcontainer') || url.includes('local-credentialless')) {
        return null
      }

      return originalOpen.apply(this, args)
    }

    return () => {
      window.open = originalOpen
    }
  }, [])

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
    let serverTimeout: NodeJS.Timeout | null = null

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

        // Log file structure for debugging
        const fileList = Object.keys(files)
        log(`Files to mount (${fileList.length}):`)
        fileList.forEach((f) => log(`  - ${f}`))

        // Check for essential files
        if (!files['package.json']) {
          log('⚠️ Warning: package.json is missing!')
        } else {
          try {
            const pkg = JSON.parse(files['package.json'])
            const depCount = Object.keys(pkg.dependencies || {}).length
            const devDepCount = Object.keys(pkg.devDependencies || {}).length
            log(`package.json: ${depCount} dependencies, ${devDepCount} devDependencies`)

            if (!pkg.scripts?.dev) {
              log('⚠️ Warning: dev script is missing in package.json!')
            }
          } catch {
            log('⚠️ Warning: package.json is not valid JSON!')
          }
        }

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
            serverUrl = u
          }
        })

        log('Installing dependencies...')
        const inst = await wc.spawn('npm', ['install'])

        let installOutput = ''
        let errorOutput = ''

        inst.output.pipeTo(
          new WritableStream({
            write(data) {
              if (!cleanup) {
                installOutput += data
                const sanitized = data.replace(/https?:\/\/[^\s]+/g, '[URL]')
                log(sanitized)

                // Capture potential error indicators
                if (
                  data.toLowerCase().includes('error') ||
                  data.toLowerCase().includes('failed') ||
                  data.toLowerCase().includes('warn')
                ) {
                  errorOutput += data + '\n'
                }
              }
            },
          })
        )

        const code = await inst.exit
        if (cleanup) return

        if (code !== 0) {
          log('✗ npm install failed with detailed error output:')
          log('─'.repeat(50))

          // Log the most relevant error information
          if (errorOutput) {
            log('Error/Warning messages:')
            log(errorOutput)
          }

          // Log last 20 lines of output for context
          const outputLines = installOutput.split('\n').filter((line) => line.trim())
          const lastLines = outputLines.slice(-20).join('\n')
          log('Last 20 lines of output:')
          log(lastLines)
          log('─'.repeat(50))

          throw new Error(`npm install failed with exit code ${code}. Check logs above for details.`)
        }

        log('✓ Dependencies installed')

        log('Starting dev server...')
        devProcess = await wc.spawn('npm', ['run', 'dev'])
        setCurrentProcess(devProcess)

        let serverReady = false
        let devServerOutput = ''

        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (!cleanup) {
                devServerOutput += data
                const sanitized = data.replace(/https?:\/\/[^\s]+/g, '[URL]')
                log(sanitized)

                // Check for dev server errors
                if (data.toLowerCase().includes('error') && !serverReady) {
                  log('⚠️ Dev server encountered an error')
                }

                if (
                  !serverReady &&
                  serverUrl &&
                  (data.includes('Ready in') || data.includes('compiled successfully'))
                ) {
                  serverReady = true
                  log('🎉 Next.js fully started!')
                  log('✓ Loading preview')
                  setTimeout(() => {
                    if (!cleanup) {
                      setUrl(serverUrl)
                      setStatus('ready')
                    }
                  }, 500)
                }
              }
            },
          })
        )

        // Add timeout detection for dev server startup
        serverTimeout = setTimeout(() => {
          if (!serverReady && !cleanup) {
            log('⚠️ Dev server did not start within 30 seconds')
            log('Last dev server output:')
            const outputLines = devServerOutput.split('\n').filter((line) => line.trim())
            log(outputLines.slice(-10).join('\n'))
          }
        }, 30000)
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
      if (serverTimeout) {
        clearTimeout(serverTimeout)
      }
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
              <div className="bg-muted mt-4 rounded-lg p-4 text-left text-xs">
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
          <div className="bg-muted/30 border-t p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-foreground text-xs font-semibold">Error Logs</span>
            </div>
            <div className="bg-background text-muted-foreground max-h-48 overflow-auto rounded border p-3 font-mono text-xs">
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
          <span className="text-muted-foreground text-sm">Starting up, please wait...</span>
        </div>
        {logs.length > 0 && (
          <div className="bg-muted/30 border-t p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-foreground text-xs font-semibold">Startup Logs</span>
              <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)}>
                <Terminal className="h-3 w-3" />
                <span className="ml-1 text-xs">{showLogs ? 'Hide' : 'Show'}</span>
              </Button>
            </div>
            {showLogs && (
              <div ref={logsRef} className="bg-background max-h-48 overflow-auto rounded border p-3 font-mono text-xs">
                {logs.map((l, i) => (
                  <div key={i} className="text-muted-foreground py-0.5 leading-relaxed">
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
      <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-2">
        <span className="text-muted-foreground flex-1 truncate text-xs">{url ? 'Preview Running' : 'No URL'}</span>
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
            allow="cross-origin-isolated"
            className="h-full w-full border-0"
            onLoad={() => log('✓ iframe loaded successfully')}
            onError={() => log('✗ iframe loading failed')}
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">Waiting for URL...</div>
        )}
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="bg-muted/30 border-t">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-foreground text-xs font-semibold">Logs</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLogs(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div ref={logsRef} className="max-h-64 overflow-auto p-3 font-mono text-xs">
            {logs.map((l, i) => (
              <div key={i} className="text-muted-foreground py-0.5 leading-relaxed">
                {l}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
