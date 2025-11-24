'use client'

import {
  ExternalLink,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import apiClient from '@/libs/utils/axios'

import type { CompetitorResearchResponse } from '@/libs/types/competitor.types'

interface CompetitorViewProps {
  chatId: string
  refreshTrigger?: number
}

export function CompetitorView({ chatId, refreshTrigger }: CompetitorViewProps) {
  const [research, setResearch] = useState<CompetitorResearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadResearch = async () => {
      try {
        console.log('[CompetitorView] Loading research for chatId:', chatId, 'refreshTrigger:', refreshTrigger)
        setIsLoading(true)
        setError(null)
        const response = await apiClient.get(`/api/chats/${chatId}/competitor-research/latest`)
        console.log('[CompetitorView] Research loaded:', response.data)
        console.log('[CompetitorView] Analysis data:', response.data.analysis)
        setResearch(response.data)
      } catch (err: unknown) {
        console.error('[CompetitorView] Error loading research:', err)
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status?: number } }
          if (axiosError.response?.status === 404) {
            setResearch(null)
          } else {
            setError('Failed to load competitor research')
          }
        } else {
          setError('Failed to load competitor research')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (chatId) {
      loadResearch()
    }
  }, [chatId, refreshTrigger])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading competitor analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!research) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-2 text-sm">No competitor research available yet</p>
          <p className="text-muted-foreground text-xs">
            Click &ldquo;Search Competitors&rdquo; to get AI-powered insights
          </p>
        </div>
      </div>
    )
  }

  if (research.status === 'failed') {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Analysis failed: {research.errorMessage || 'Unknown error'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (research.status === 'processing' || research.status === 'pending') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Analyzing competitors...</p>
      </div>
    )
  }

  const analysis = research.analysis

  if (!analysis) {
    console.warn('[CompetitorView] No analysis data, status:', research.status)
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="space-y-2 text-center">
          <p className="text-muted-foreground text-sm">Analysis is still processing</p>
          <p className="text-muted-foreground text-xs">
            This may take a few moments. The page will update automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">{analysis.summary}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="competitors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="insights">Market Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="competitors" className="mt-3 space-y-3">
            {analysis.competitors.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">No competitors identified</p>
            ) : (
              analysis.competitors.map((competitor, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{competitor.name}</CardTitle>
                        <CardDescription className="text-xs">{competitor.description}</CardDescription>
                      </div>
                      {competitor.url && (
                        <a
                          href={competitor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 shrink-0">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {competitor.keyFeatures.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-medium">Key Features</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {competitor.keyFeatures.map((feature, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {competitor.strengths.length > 0 && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-1 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {competitor.strengths.map((strength, i) => (
                              <li key={i} className="text-muted-foreground text-xs">
                                • {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {competitor.weaknesses.length > 0 && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-1 text-xs font-medium">
                            <XCircle className="h-3 w-3 text-red-500" />
                            Weaknesses
                          </h4>
                          <ul className="space-y-1">
                            {competitor.weaknesses.map((weakness, i) => (
                              <li key={i} className="text-muted-foreground text-xs">
                                • {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 border-t pt-2 text-xs">
                      {competitor.targetAudience && (
                        <div className="flex items-center gap-1.5">
                          <Users className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground">{competitor.targetAudience}</span>
                        </div>
                      )}
                      {competitor.pricing && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground">{competitor.pricing}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-3 space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Common Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.marketInsights.commonFeatures.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No common features identified</p>
                ) : (
                  <ul className="space-y-1">
                    {analysis.marketInsights.commonFeatures.map((feature, i) => (
                      <li key={i} className="text-muted-foreground text-xs">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Market Gaps & Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.marketInsights.marketGaps.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium">Unmet Needs</h4>
                    <ul className="space-y-1">
                      {analysis.marketInsights.marketGaps.map((gap, i) => (
                        <li key={i} className="text-muted-foreground text-xs">
                          • {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.marketInsights.opportunities.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium">Opportunities</h4>
                    <ul className="space-y-1">
                      {analysis.marketInsights.opportunities.map((opportunity, i) => (
                        <li key={i} className="text-muted-foreground text-xs">
                          • {opportunity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {analysis.marketInsights.trends.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Market Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysis.marketInsights.trends.map((trend, i) => (
                      <li key={i} className="text-muted-foreground text-xs">
                        • {trend}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Strategic Recommendations</CardTitle>
                <CardDescription className="text-xs">Based on competitive analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.recommendations.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No recommendations available</p>
                ) : (
                  <ul className="space-y-2">
                    {analysis.recommendations.map((recommendation, i) => (
                      <li key={i} className="text-muted-foreground flex gap-2 text-xs">
                        <span className="text-primary shrink-0 font-medium">{i + 1}.</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
