'use client'

import { AlertCircle, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

import { requirementApi, GeneratedDocument, RequirementGenerationStatus } from '@/api/requirements'
import { cn } from '@/libs/utils'

interface RequirementGeneratorProps {
  onDocumentCreated?: (documentId: string) => void
  onRequirementSubmitted?: (requirement: string) => void
  className?: string
  isEmbedded?: boolean // New prop to indicate if it's embedded in chat
}

export function RequirementGenerator({
  onDocumentCreated,
  onRequirementSubmitted,
  className,
  isEmbedded = false,
}: RequirementGeneratorProps) {
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<RequirementGenerationStatus | null>(null)
  const [results, setResults] = useState<GeneratedDocument[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('请输入需求描述')
      return
    }

    // If embedded in chat, submit as first message instead of generating documents
    if (isEmbedded && onRequirementSubmitted) {
      onRequirementSubmitted(input.trim())
      setInput('') // Clear input after submission
      return
    }

    setIsGenerating(true)
    setShowResults(false)
    setResults([])

    try {
      // Start the requirement generation process
      const response = await requirementApi.generateRequirements({
        initial_requirements: input.trim(),
      })

      toast.success('需求分析已开始，AI agent正在工作...')

      // Poll for completion with progress updates
      const finalResults = await requirementApi.pollForCompletion(response.task_id, (currentStatus) => {
        setStatus(currentStatus)
      })

      setResults(finalResults.documents)
      setShowResults(true)
      toast.success(`需求分析完成！生成了 ${finalResults.documents.length} 个文档`)
    } catch (error) {
      console.error('Requirement generation failed:', error)
      toast.error('需求生成失败: ' + (error as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDocument = async (doc: GeneratedDocument) => {
    try {
      // Create document using the markdown API
      const { documentApi } = await import('@/api/document')
      const response = await documentApi.createFromMarkdown({
        title: doc.title,
        markdownContent: doc.content,
      })

      toast.success(`文档 "${doc.title}" 已成功保存`)

      if (onDocumentCreated) {
        onDocumentCreated(response.id)
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      toast.error('保存文档失败: ' + (error as Error).message)
    }
  }

  const handleSaveAllDocuments = async () => {
    try {
      toast.loading(`正在保存 ${results.length} 个文档...`)

      const { documentApi } = await import('@/api/document')
      const savedDocuments: string[] = []

      for (const doc of results) {
        try {
          const response = await documentApi.createFromMarkdown({
            title: doc.title,
            markdownContent: doc.content,
          })
          savedDocuments.push(response.id)
        } catch (error) {
          console.error(`Failed to save document "${doc.title}":`, error)
        }
      }

      if (savedDocuments.length === results.length) {
        toast.success(`已成功保存所有 ${results.length} 个文档`)
      } else {
        toast.success(`已保存 ${savedDocuments.length} / ${results.length} 个文档`)
      }

      if (onDocumentCreated && savedDocuments.length > 0) {
        // Call with the first document ID as a representative
        onDocumentCreated(savedDocuments[0])
      }
    } catch (error) {
      console.error('Failed to save all documents:', error)
      toast.error('批量保存失败: ' + (error as Error).message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'running':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={cn(className, 'space-y-4')}>
      {/* Embedded mode header */}
      {isEmbedded && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          <span>输入项目需求后即可开始AI对话</span>
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{isEmbedded ? '请详细描述您的项目需求' : '需求描述'}</label>
        <Textarea
          placeholder={
            isEmbedded
              ? '请详细描述您想要开发的项目需求，例如：我想开发一个在线教育平台，包含课程管理、用户学习、支付系统等功能...'
              : '例如：我想开发一个博客网站，用户可以发布文章、评论、点赞...'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isGenerating}
          rows={isEmbedded ? 3 : 4}
          className={isEmbedded ? 'resize-none border-dashed' : ''}
        />
      </div>

      {/* Action Button */}
      <Button onClick={handleGenerate} disabled={isGenerating || !input.trim()} className="w-full">
        {isGenerating ? '生成中...' : isEmbedded ? '提交需求并开始对话' : '开始生成需求文档'}
      </Button>

      {/* Progress Section */}
      {!isEmbedded && isGenerating && status && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">生成进度</span>
                <Badge className={getStatusColor(status.status)}>{status.status}</Badge>
              </div>
              <Progress value={status.progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{status.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {!isEmbedded && showResults && results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">生成的文档</CardTitle>
              <Button onClick={handleSaveAllDocuments} size="sm">
                <Save className="mr-2 h-4 w-4" />
                保存所有文档
              </Button>
            </div>
            <CardDescription>AI已生成 {results.length} 个需求文档，你可以查看并保存到Jotlin中</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((doc, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">类型: {doc.type}</p>
                        <div className="mt-2 rounded-md bg-muted p-3">
                          <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm">
                            {doc.content.substring(0, 200)}
                            {doc.content.length > 200 && '...'}
                          </pre>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleSaveDocument(doc)}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {!isEmbedded && (
        <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">提示：</p>
            <p className="text-blue-700">
              描述越详细，生成的需求文档越准确。可以包括功能需求、用户角色、技术栈偏好等信息。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
