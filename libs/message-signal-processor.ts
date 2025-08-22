import { logger } from '@/libs/config'

export interface ProgressData {
  progress: number
  message: string
  status: string
}

export interface DocumentData {
  chatId: string
  documents: any[]
}

export interface GenerationStartData {
  chatId: string
  taskId: string
}

export interface SignalProcessorCallbacks {
  onProgressUpdate: (data: ProgressData) => void
  onGenerationStart: (data: GenerationStartData) => void
  onDocumentsGenerated: (data: DocumentData) => void
}

export class MessageSignalProcessor {
  private callbacks: SignalProcessorCallbacks

  constructor(callbacks: SignalProcessorCallbacks) {
    this.callbacks = callbacks
  }

  processLine(line: string): boolean {
    // Returns true if the line should be displayed, false if it's a signal

    // Check for generation progress signal
    if (line.includes('__GENERATION_PROGRESS__:')) {
      this.processProgressSignal(line)
      return false
    }

    // Check for document generation start signal
    if (line.includes('__DOCUMENT_GENERATION_START__:')) {
      this.processGenerationStartSignal(line)
      return false
    }

    // Check for documents generated signal
    if (line.includes('__DOCUMENTS_GENERATED__:')) {
      this.processDocumentsGeneratedSignal(line)
      return false
    }

    return true
  }

  private processProgressSignal(line: string): void {
    const signalStart = line.indexOf('__GENERATION_PROGRESS__:')
    const signalData = line.substring(signalStart + '__GENERATION_PROGRESS__:'.length).trim()

    try {
      const progressData: ProgressData = JSON.parse(signalData)
      logger.info('Generation progress update:', progressData)
      this.callbacks.onProgressUpdate(progressData)
    } catch (error) {
      logger.error('Failed to parse generation progress signal:', {
        error,
        line,
        signalData,
      })
    }
  }

  private processGenerationStartSignal(line: string): void {
    const signalStart = line.indexOf('__DOCUMENT_GENERATION_START__:')
    const signalData = line.substring(signalStart + '__DOCUMENT_GENERATION_START__:'.length).trim()

    try {
      const data: GenerationStartData = JSON.parse(signalData)
      logger.info('Document generation started:', data)
      this.callbacks.onGenerationStart(data)
    } catch (error) {
      logger.error('Failed to parse generation start signal:', {
        error,
        line,
        signalData,
      })
    }
  }

  private processDocumentsGeneratedSignal(line: string): void {
    const signalStart = line.indexOf('__DOCUMENTS_GENERATED__:')
    const signalData = line.substring(signalStart + '__DOCUMENTS_GENERATED__:'.length).trim()

    try {
      const documentData: DocumentData = JSON.parse(signalData)
      logger.info('Successfully parsed document generation signal:', documentData)
      this.callbacks.onDocumentsGenerated(documentData)
    } catch (error) {
      logger.error('Failed to parse document generation signal:', {
        error,
        line,
        signalData,
      })
    }
  }
}

// Utility function to create progress documents based on progress percentage
export const createProgressDocuments = (progress: number, message: string) => {
  const baseDocuments = [
    '识别最终用户和利益相关者',
    '进行用户访谈和收集需求',
    '分析部署环境和约束',
    '分析需求并生成用例模型',
    '生成IEEE 29148兼容的SRS文档',
    '进行SRS文档质量审查',
  ]

  return baseDocuments.map((title, index) => {
    const stepProgress = (index + 1) * (100 / baseDocuments.length)

    if (progress > stepProgress) {
      return {
        title: `✓ ${title}`,
        content: '',
        progress: 100,
      }
    } else if (progress > index * (100 / baseDocuments.length)) {
      return {
        title: message || `${title}...`,
        content: '',
        progress: Math.min(progress, stepProgress),
      }
    } else {
      return {
        title: `${title}...`,
        content: '',
        progress: 0,
      }
    }
  })
}

// Default analysis documents for initialization
export const getDefaultAnalysisDocuments = () => [
  {
    title: '识别最终用户和利益相关者...',
    content: '',
    progress: 0,
  },
  {
    title: '进行用户访谈和收集需求...',
    content: '',
    progress: 0,
  },
  {
    title: '分析部署环境和约束...',
    content: '',
    progress: 0,
  },
  {
    title: '分析需求并生成用例模型...',
    content: '',
    progress: 0,
  },
  {
    title: '生成IEEE 29148兼容的SRS文档...',
    content: '',
    progress: 0,
  },
  {
    title: '进行SRS文档质量审查...',
    content: '',
    progress: 0,
  },
]
