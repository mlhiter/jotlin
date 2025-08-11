"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, FileText, Download, Save } from 'lucide-react'
import { requirementApi, GeneratedDocument, RequirementGenerationStatus } from '@/api/requirements'
import { toast } from 'sonner'

interface RequirementGeneratorProps {
  onDocumentCreated?: (documentId: string) => void
  className?: string
}

export function RequirementGenerator({ onDocumentCreated, className }: RequirementGeneratorProps) {
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

    setIsGenerating(true)
    setShowResults(false)
    setResults([])

    try {
      // Start the requirement generation process
      const response = await requirementApi.generateRequirements({
        initial_requirements: input.trim()
      })

      toast.success('需求分析已开始，AI agent正在工作...')

      // Poll for completion with progress updates
      const finalResults = await requirementApi.pollForCompletion(
        response.task_id,
        (currentStatus) => {
          setStatus(currentStatus)
        }
      )

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
      // For now, we'll use a placeholder - this should integrate with your document API
      // You can replace this with the actual document creation API call
      console.log('Saving document:', doc.title)
      
      // Placeholder: Copy content to clipboard for now
      await navigator.clipboard.writeText(doc.content)
      toast.success(`文档 "${doc.title}" 内容已复制到剪贴板`)
      
      // TODO: Integrate with actual document API
      // const response = await documentApi.create({
      //   title: doc.title,
      //   content: doc.content
      // })
      
      if (onDocumentCreated) {
        onDocumentCreated('placeholder-id')
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      toast.error('保存文档失败')
    }
  }

  const handleSaveAllDocuments = async () => {
    try {
      // Placeholder implementation
      const allContent = results.map(doc => `# ${doc.title}\n\n${doc.content}\n\n---\n\n`).join('')
      await navigator.clipboard.writeText(allContent)
      toast.success(`已将所有 ${results.length} 个文档复制到剪贴板`)
      
      // TODO: Integrate with actual document API for batch creation
    } catch (error) {
      console.error('Failed to save all documents:', error)
      toast.error('批量保存失败')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI需求文档生成器
          </CardTitle>
          <CardDescription>
            描述你的项目需求，AI会通过多agent协作生成完整的需求文档
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">需求描述</label>
            <Textarea
              placeholder="例如：我想开发一个博客网站，用户可以发布文章、评论、点赞..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
              rows={4}
            />
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className="w-full"
          >
            {isGenerating ? '生成中...' : '开始生成需求文档'}
          </Button>

          {/* Progress Section */}
          {isGenerating && status && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">生成进度</span>
                    <Badge className={getStatusColor(status.status)}>
                      {status.status}
                    </Badge>
                  </div>
                  <Progress value={status.progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {status.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {showResults && results.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">生成的文档</CardTitle>
                  <Button onClick={handleSaveAllDocuments} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    保存所有文档
                  </Button>
                </div>
                <CardDescription>
                  AI已生成 {results.length} 个需求文档，你可以查看并保存到Jotlin中
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((doc, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              类型: {doc.type}
                            </p>
                            <div className="mt-2 p-3 bg-muted rounded-md">
                              <pre className="whitespace-pre-wrap text-sm max-h-32 overflow-y-auto">
                                {doc.content.substring(0, 200)}
                                {doc.content.length > 200 && '...'}
                              </pre>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveDocument(doc)}
                            >
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
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">提示：</p>
              <p className="text-blue-700">
                描述越详细，生成的需求文档越准确。可以包括功能需求、用户角色、技术栈偏好等信息。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}