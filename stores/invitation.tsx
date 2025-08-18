import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { invitationApi } from '@/api/invitation'
import { Invitation } from '@/types/invitation'

type InvitationStore = {
  invitations: Invitation[] | null
  unreadCount: number

  fetchInvitations: (email: string) => Promise<void>
  fetchUnreadCount: (email: string) => Promise<void>
  markInboxAsViewed: (email: string) => Promise<void>
  markAsRead: (id: string, userEmail: string) => void
  getUnreadCount: () => number

  createInvitation: (params: {
    documentId: string
    collaboratorEmail: string
    userEmail: string
  }) => Promise<Invitation>

  updateInvitation: (params: {
    id: string
    isAccepted: boolean
  }) => Promise<void>
}

export const useInvitationStore = create(
  immer<InvitationStore>((set, get) => ({
    invitations: null, // 初始化为 null 以区分 loading 状态
    unreadCount: 0,

    fetchInvitations: async (email) => {
      const invitations = await invitationApi.getByEmail(email)

      set((state) => {
        state.invitations = invitations
      })

      // 同时获取未读数量
      await get().fetchUnreadCount(email)
    },

    fetchUnreadCount: async (email) => {
      try {
        const response = await fetch(
          `/api/invitations/get-by-email?email=${encodeURIComponent(email)}&countOnly=true`
        )
        if (response.ok) {
          const data = await response.json()
          set((state) => {
            state.unreadCount = data.count || 0
          })
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    },

    markInboxAsViewed: async (email) => {
      try {
        const response = await fetch('/api/users/mark-inbox-viewed', {
          method: 'POST',
        })

        if (response.ok) {
          // 标记为已查看后，重新获取未读数量
          await get().fetchUnreadCount(email)
        }
      } catch (error) {
        console.error('Error marking inbox as viewed:', error)
      }
    },

    markAsRead: (id: string, userEmail: string) => {
      set((state) => {
        if (state.invitations) {
          const invitation = state.invitations.find((inv) => inv.id === id)
          if (invitation) {
            // 根据用户角色减少未读计数
            const shouldDecrease =
              invitation.collaboratorEmail === userEmail
                ? !invitation.isReplied
                : invitation.isReplied
            if (shouldDecrease) {
              state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
          }
        }
      })
    },

    getUnreadCount: () => {
      return get().unreadCount
    },

    createInvitation: async (params) => {
      const invitation = await invitationApi.create(params)
      set((state) => {
        if (state.invitations) {
          state.invitations.push(invitation)
          // 不增加 unreadCount，因为邀请人发送邀请不应该显示红点
        }
      })
      return invitation
    },

    updateInvitation: async (params) => {
      await invitationApi.update(params)
      set((state) => {
        if (state.invitations) {
          const index = state.invitations.findIndex(
            (inv: Invitation) => inv.id === params.id
          )
          if (index !== -1) {
            state.invitations[index].isAccepted = params.isAccepted
            state.invitations[index].isReplied = true
            // 被邀请人回复后，自己的未读数应该减1（因为处理了一个待回复的邀请）
            state.unreadCount = Math.max(0, state.unreadCount - 1)
          }
        }
      })
    },
  }))
)
