'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useAuth } from '@/hooks/use-auth'
import apiClient from '@/libs/utils/axios'

interface Feedback {
  id: string
  type: string
  title: string
  content: string
  email?: string
  userId?: string
  user?: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function FeedbackAdminPage() {
  const { user, isLoading, isAdmin } = useAuth()
  const t = useTranslations('feedback')
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      BUG_REPORT: t('types.bugReport'),
      FEATURE_REQUEST: t('types.featureRequest'),
      GENERAL: t('types.general'),
      COMPLAINT: t('types.complaint'),
      COMPLIMENT: t('types.compliment'),
    }
    return typeMap[type] || type
  }

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      BUG_REPORT: 'bg-red-100 text-red-800',
      FEATURE_REQUEST: 'bg-blue-100 text-blue-800',
      GENERAL: 'bg-gray-100 text-gray-800',
      COMPLAINT: 'bg-orange-100 text-orange-800',
      COMPLIMENT: 'bg-green-100 text-green-800',
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800'
  }

  const getColumns = (): ColumnDef<Feedback>[] => [
    {
      accessorKey: 'type',
      header: t('admin.columns.type'),
      cell: ({ row }) => {
        const type = row.getValue('type') as string
        return (
          <Badge className={getTypeColor(type)} variant="secondary">
            {getTypeLabel(type)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'title',
      header: ({ column }) => {
        return (
          <div
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex cursor-pointer items-center">
            {t('admin.columns.title')}
            <ArrowUpDown className="h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
    },
    {
      id: 'content',
      accessorKey: 'content',
      header: t('admin.columns.content'),
      cell: ({ row, table }) => {
        const content = row.getValue('content') as string
        const rowId = row.id
        const maxLength = 100
        const shouldTruncate = content.length > maxLength

        const meta = table.options.meta as { expandedRows?: Set<string>; toggleExpanded?: (id: string) => void }
        const expandedRows = meta?.expandedRows || new Set()
        const isExpanded = expandedRows.has(rowId)
        const toggleExpanded = meta?.toggleExpanded

        return (
          <div className="max-w-md">
            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {shouldTruncate && !isExpanded ? content.substring(0, maxLength) + '...' : content}
            </div>
            {shouldTruncate && (
              <button
                onClick={() => toggleExpanded?.(rowId)}
                className="mt-1 text-xs text-blue-600 underline hover:text-blue-800 focus:outline-none">
                {isExpanded ? t('admin.showLess') : t('admin.showMore')}
              </button>
            )}
          </div>
        )
      },
    },
    {
      id: 'submitter',
      header: t('admin.columns.submitter'),
      cell: ({ row }) => {
        const feedback = row.original
        return (
          <div className="text-sm">
            <div className="font-medium">{feedback.user?.name || t('admin.anonymous')}</div>
            {(feedback.user?.email || feedback.email) && (
              <div className="text-gray-500">{feedback.user?.email || feedback.email}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <div
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex cursor-pointer items-center">
            {t('admin.columns.date')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return (
          <div className="text-sm">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        )
      },
    },
  ]

  const fetchFeedbacks = async () => {
    try {
      const response = await apiClient.get('/api/feedback')
      setFeedbacks(response.data)
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error)
      toast.error(t('admin.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const toggleExpanded = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

  const table = useReactTable({
    data: feedbacks,
    columns: getColumns(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
      expandedRows,
      toggleExpanded,
    },
  })

  // Permission check
  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">{t('admin.loading')}</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="p-6 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t('admin.accessDenied')}</h1>
        <p>{t('admin.noPermission')}</p>
        <p className="mt-2 text-sm text-gray-500">{t('admin.requiredRole')}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
      </div>

      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder={t('admin.filterPlaceholder')}
            value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('title')?.setFilterValue(event.target.value)}
            className="max-w-sm shadow-none"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={getColumns().length} className="h-24 text-center">
                    {t('admin.noFeedback')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {t('admin.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{' '}
            {t('admin.to')}{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            {t('admin.of')} {table.getFilteredRowModel().rows.length} {t('admin.feedbacks')}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">{t('admin.pagination.first')}</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">{t('admin.pagination.previous')}</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="hidden items-center space-x-1 md:flex">
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const currentPage = table.getState().pagination.pageIndex
                const totalPages = table.getPageCount()
                let pageNumber: number

                if (totalPages <= 5) {
                  pageNumber = i
                } else if (currentPage < 3) {
                  pageNumber = i
                } else if (currentPage > totalPages - 4) {
                  pageNumber = totalPages - 5 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.setPageIndex(pageNumber)}>
                    {pageNumber + 1}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}>
              <span className="sr-only">{t('admin.pagination.next')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}>
              <span className="sr-only">{t('admin.pagination.last')}</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
