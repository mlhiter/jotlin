import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { invitationApi } from '@/api/invitation'
import { Invitation } from '@/types/invitation'

type InvitationStore = {
  invitations: Invitation[]

  fetchInvitations: (email: string) => Promise<void>

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
  immer<InvitationStore>((set) => ({
    invitations: [],

    fetchInvitations: async (email) => {
      const invitations = await invitationApi.getByEmail(email)
      set((state) => {
        state.invitations = invitations
      })
    },

    createInvitation: async (params) => {
      const invitation = await invitationApi.create(params)
      set((state) => {
        state.invitations.push(invitation)
      })
      return invitation
    },

    updateInvitation: async (params) => {
      await invitationApi.update(params)
      set((state) => {
        const index = state.invitations.findIndex(
          (inv: Invitation) => inv.id === params.id
        )
        if (index !== -1) {
          state.invitations[index].isAccepted = params.isAccepted
          state.invitations[index].isReplied = true
        }
      })
    },
  }))
)
