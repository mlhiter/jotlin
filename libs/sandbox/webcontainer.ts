import { WebContainer, type WebContainerProcess } from '@webcontainer/api'

let webcontainerInstance: WebContainer | null = null
let bootPromise: Promise<WebContainer> | null = null
let currentProcess: WebContainerProcess | null = null

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance
  }

  if (bootPromise) {
    return bootPromise
  }

  bootPromise = WebContainer.boot({
    workdirName: 'jotlin-project',
    coep: 'credentialless',
  })
    .then((instance) => {
      webcontainerInstance = instance
      bootPromise = null
      return instance
    })
    .catch((error) => {
      bootPromise = null
      throw error
    })

  return bootPromise
}

export function getWebContainerInstance(): WebContainer | null {
  return webcontainerInstance
}

export function setCurrentProcess(process: WebContainerProcess | null) {
  currentProcess = process
}

export async function killCurrentProcess() {
  if (currentProcess) {
    try {
      currentProcess.kill()
      currentProcess = null
    } catch (e) {
      console.warn('Failed to kill process:', e)
    }
  }
}

export async function teardownWebContainer() {
  await killCurrentProcess()
  if (webcontainerInstance) {
    try {
      webcontainerInstance.teardown()
    } catch (e) {
      console.warn('Failed to teardown WebContainer:', e)
    }
    webcontainerInstance = null
  }
}
