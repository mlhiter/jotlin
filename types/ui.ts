export interface SidebarState {
  isVisible: boolean
  userClosed: boolean
  manuallyOpened: boolean
  stateBeforeCollapse: boolean | null
  autoCollapsed: boolean
}

export interface DraftPanelState {
  isVisible: boolean
  activeTab: string
  userClosedPanel: boolean
}
