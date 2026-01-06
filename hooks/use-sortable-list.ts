import { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

interface UseSortableListOptions<T extends { id: string; order: number }> {
  items: T[]
  queryKey: (string | undefined)[]
  reorderEndpoint: string
  additionalData?: Record<string, any>
  onReorderSuccess?: () => void
}

export function useSortableList<T extends { id: string; order: number }>({
  items,
  queryKey,
  reorderEndpoint,
  additionalData = {},
  onReorderSuccess,
}: UseSortableListOptions<T>) {
  const queryClient = useQueryClient()

  const reorderMutation = useMutation({
    mutationFn: async (orders: { id: string; order: number }[]) => {
      const response = await apiClient.post(reorderEndpoint, {
        ...additionalData,
        orders,
      })
      return response.data
    },
    onMutate: async () => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey })

      // Save old data for rollback (optimistic update already done in handleDragEnd)
      const previousData = queryClient.getQueryData(queryKey)

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback to old data
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error('Failed to reorder items')
      console.error('Reorder error:', err)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      onReorderSuccess?.()
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder array
    const reorderedItems = arrayMove(items, oldIndex, newIndex)

    // Generate new order values (0, 1, 2...)
    const newOrders = reorderedItems.map((item, index) => ({
      id: item.id,
      order: index,
    }))

    // Immediate optimistic update BEFORE mutation
    const orderMap = new Map(newOrders.map((o) => [o.id, o.order]))
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      if (!old) return old
      return old
        .map((item) => ({ ...item, order: orderMap.get(item.id) ?? item.order }))
        .sort((a, b) => a.order - b.order)
    })

    reorderMutation.mutate(newOrders)
  }

  return {
    handleDragEnd,
    isReordering: reorderMutation.isPending,
  }
}
