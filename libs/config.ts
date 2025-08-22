// 环境配置管理
export const config = {
  // 环境检测
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // 超时配置
  timeouts: {
    documentGeneration: parseInt(process.env.DOCUMENT_GENERATION_TIMEOUT || '1800000'), // 30分钟 - 增加到更合理的时间
    aiResponse: parseInt(process.env.AI_RESPONSE_TIMEOUT || '600000'), // 5分钟
    progressUpdate: 100, // 进度更新延迟
    stateSync: 200, // 状态同步延迟
    analysisPhase: parseInt(process.env.ANALYSIS_PHASE_TIMEOUT || '900000'), // 15分钟 - 分析阶段超时
    documentCreation: parseInt(process.env.DOCUMENT_CREATION_TIMEOUT || '900000'), // 10分钟 - 文档创建阶段超时
  },

  // 调试配置
  debug: {
    enabled: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  },

  // 重试配置
  retry: {
    maxAttempts: 3,
    delay: 1000,
  },
}

// 日志工具
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (config.debug.enabled) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },

  info: (message: string, ...args: any[]) => {
    if (config.debug.logLevel === 'info' || config.debug.logLevel === 'debug') {
      console.info(`[INFO] ${message}`, ...args)
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (config.debug.logLevel !== 'error') {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args)
  },
}
