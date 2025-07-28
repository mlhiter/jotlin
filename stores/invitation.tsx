import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import {
  createInvitation,
  getInvitationsByEmail,
  updateInvitation,
} from '@/api/invitation'
import { Invitation } from '@/types/invitation'

type InvitationStore = {
  invitations: Invitation[]
  unreadCount: number

  fetchInvitations: (email: string) => Promise<void>
  markAsRead: (id: string) => void
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
    invitations: [],
    unreadCount: 0,

    fetchInvitations: async (email) => {
      const invitations = await getInvitationsByEmail(email)
      set((state) => {
        state.invitations = invitations
        state.unreadCount = invitations.filter((inv) => !inv.isReplied).length
      })
    },

    markAsRead: (id: string) => {
      set((state) => {
        const invitation = state.invitations.find((inv) => inv.id === id)
        if (invitation && !invitation.isReplied) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
    },

    getUnreadCount: () => {
      return get().unreadCount
    },

    createInvitation: async (params) => {
      const invitation = await createInvitation(params)
      set((state) => {
        state.invitations.push(invitation)
      })
      return invitation
    },

    updateInvitation: async (params) => {
      await updateInvitation(params)
      set((state) => {
        const index = state.invitations.findIndex(
          (inv: Invitation) => inv.id === params.id
        )
        if (index !== -1) {
          state.invitations[index].isAccepted = params.isAccepted
          state.invitations[index].isReplied = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
    },
  }))
)
