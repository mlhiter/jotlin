export const dynamic = 'force-dynamic'

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background min-h-screen">{children}</div>
}
