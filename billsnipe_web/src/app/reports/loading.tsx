import { ReportsSkeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ReportsSkeleton />
      </main>
    </div>
  )
}
