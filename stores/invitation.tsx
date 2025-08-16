import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { invitationApi } from '@/api/invitation'
import { Invitation } from '@/types/invitation'

type InvitationStore = {
  invitations: Invitation[] | null
  unreadCount: number

  fetchInvitations: (email: string) => Promise<void>
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

      // 计算未读数量：
      // 1. 如果当前用户是被邀请人(collaboratorEmail)且未回复，算作未读
      // 2. 如果当前用户是邀请人(userEmail)且收到了回复，算作未读
      const newUnreadCount = invitations.filter((inv) => {
        if (inv.collaboratorEmail === email) {
          // 当前用户是被邀请人，未回复的邀请算作未读
          return !inv.isReplied
        } else if (inv.userEmail === email) {
          // 当前用户是邀请人，已回复的邀请算作未读（需要查看回复结果）
          return inv.isReplied
        }
        return false
      }).length

      set((state) => {
        state.invitations = invitations
        state.unreadCount = newUnreadCount
      })
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
