import { GET, POST } from '@/libs/axios'

export interface RequirementGenerationRequest {
  initial_requirements: string
}

export interface RequirementGenerationResponse {
  task_id: string
  status: string
  message: string
}

export interface RequirementGenerationStatus {
  id: string
  status: 'started' | 'running' | 'completed' | 'failed'
  progress: number
  message: string
  results?: any
}

export interface GeneratedDocument {
  title: string
  content: string
  type: string
  generated_at: string
  ready_for_save: boolean
}

export interface FormattedRequirementResults {
  documents: GeneratedDocument[]
  conversations: any[]
  summary: string
}

// Python FastAPI backend configuration
const PYTHON_BACKEND_URL =
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000'

// Create a separate axios instance for Python backend
import axios from 'axios'

const pythonRequest = axios.create({
  baseURL: PYTHON_BACKEND_URL,
  withCredentials: false,
  timeout: 60000 * 10, // 10 minutes for requirement generation
})

pythonRequest.interceptors.response.use((response) => {
  return response.data
})

export const requirementApi = {
  // Generate requirements using the Python backend for chat integration
  generateRequirements: async (
    data: RequirementGenerationRequest
  ): Promise<RequirementGenerationResponse> => {
    return pythonRequest.post('/api/requirements/generate-from-chat', data)
  },

  // Get the status of requirement generation
  getGenerationStatus: async (
    taskId: string
  ): Promise<RequirementGenerationStatus> => {
    return pythonRequest.get(`/api/requirements/status/${taskId}`)
  },

  // Get formatted results for frontend
  getFormattedResults: async (
    taskId: string
  ): Promise<FormattedRequirementResults> => {
    return pythonRequest.get(
      `/api/requirements/result/${taskId}?formatted=true`
    )
  },

  // Get raw results
  getRawResults: async (taskId: string): Promise<any> => {
    return pythonRequest.get(
      `/api/requirements/result/${taskId}?formatted=false`
    )
  },

  // Poll for completion (utility function)
  pollForCompletion: async (
    taskId: string,
    onProgress?: (status: RequirementGenerationStatus) => void,
    pollInterval: number = 2000,
    maxAttempts: number = 300 // 10 minutes maximum
  ): Promise<FormattedRequirementResults> => {
    return new Promise((resolve, reject) => {
      let attemptCount = 0
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 5

      const poll = async () => {
        try {
          attemptCount++

          // Check if we've exceeded maximum attempts
          if (attemptCount > maxAttempts) {
            reject(new Error('Polling timeout: Maximum attempts reached'))
            return
          }

          const status = await requirementApi.getGenerationStatus(taskId)
          consecutiveErrors = 0 // Reset error counter on success

          if (onProgress) {
            onProgress(status)
          }

          if (status.status === 'completed') {
            const results = await requirementApi.getFormattedResults(taskId)
            resolve(results)
          } else if (status.status === 'failed') {
            reject(new Error(status.message || 'Requirement generation failed'))
          } else {
            // Continue polling
            setTimeout(poll, pollInterval)
          }
        } catch (error) {
          consecutiveErrors++
          console.error(`Polling error (attempt ${attemptCount}):`, error)

          if (consecutiveErrors >= maxConsecutiveErrors) {
            reject(
              new Error(
                `Polling failed after ${maxConsecutiveErrors} consecutive errors`
              )
            )
            return
          }

          // Exponential backoff for error recovery
          const backoffDelay = Math.min(
            pollInterval * Math.pow(2, consecutiveErrors),
            10000
          )
          setTimeout(poll, backoffDelay)
        }
      }

      poll()
    })
  },
}

// Python Chat API for alternative AI responses
export const pythonChatApi = {
  // Get AI response from Python backend (alternative to Node.js backend)
  getAIResponse: async (chatId: string, message: string) => {
    return pythonRequest.post(`/api/chats/${chatId}/ai-response`, { message })
  },

  // Stream AI response from Python backend
  streamAIResponse: async (
    chatId: string,
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/chats/${chatId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              onComplete()
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                onChunk(parsed.content)
              } else if (parsed.error) {
                onError(new Error(parsed.error))
                return
              }
            } catch (e) {
              // Ignore malformed JSON
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  },
}
