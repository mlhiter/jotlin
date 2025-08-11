"use client"

import { RequirementGenerator } from '@/components/requirement-generator'

export default function TestRequirementsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI需求文档生成器测试</h1>
        <p className="text-muted-foreground mt-2">
          这是一个测试页面，用于验证AI多agent需求生成功能
        </p>
      </div>
      
      <RequirementGenerator 
        onDocumentCreated={(docId) => {
          console.log('Document created:', docId)
        }}
        className="max-w-4xl mx-auto"
      />
      
      <div className="mt-8 p-4 bg-muted rounded-lg max-w-4xl mx-auto">
        <h3 className="font-semibold mb-2">测试说明:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>确保Python后端已启动 (http://localhost:8000)</li>
          <li>在需求描述中输入详细的项目需求</li>
          <li>点击&quot;开始生成需求文档&quot;等待AI分析</li>
          <li>查看生成的文档结果</li>
          <li>可以将文档内容复制保存到Jotlin中</li>
        </ul>
      </div>
    </div>
  )
}