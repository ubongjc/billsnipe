import { PlansSkeleton } from '@/components/ui/skeleton'

export default function PlansLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PlansSkeleton />
      </main>
    </div>
  )
}
