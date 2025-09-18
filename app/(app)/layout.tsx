import { Suspense } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { AuthGuard } from '@/components/auth/auth-guard'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col">{children}</SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    </Suspense>
  )
}
