import { AppSidebar } from '@/components/app-sidebar'
import { AuthGuard } from '@/components/auth/auth-guard'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider className="h-screen overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">{children}</SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
