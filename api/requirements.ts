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
  timeout: 120000, // 2 minutes for requirement generation
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
    pollInterval: number = 2000
  ): Promise<FormattedRequirementResults> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await requirementApi.getGenerationStatus(taskId)

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
          reject(error)
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
