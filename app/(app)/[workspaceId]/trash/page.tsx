import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trash | Jotlin',
}

export default function TrashPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Trash</h1>
        <p className="text-sm text-muted-foreground">Deleted projects and documents</p>
      </div>
      <div className="flex-1 p-4">
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Trash interface coming soon</p>
        </div>
      </div>
    </div>
  )
}
