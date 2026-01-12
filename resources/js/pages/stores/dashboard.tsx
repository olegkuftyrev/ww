import { PageLayout } from '@/components/layout/page-layout'
import { Label } from '@/components/ui/label'
import { type BreadcrumbItem, type PageProps } from '@/types'
import { usePage } from '@inertiajs/react'

type StoreDashboardPageProps = PageProps & {
  store: {
    id: number
    number: string
  }
}

const breadcrumbs: BreadcrumbItem[] = []

const StoreDashboardPage = () => {
  const { store } = usePage<StoreDashboardPageProps>().props

  return (
    <PageLayout breadcrumbs={breadcrumbs} pageTitle={`Store ${store.number} Dashboard`}>
      <div className="w-full space-y-8 p-4">
        <div>
          <Label className="text-3xl font-bold">Store {store.number} Dashboard</Label>
          <p className="text-muted-foreground mt-2">Welcome to your store dashboard</p>
        </div>
      </div>
    </PageLayout>
  )
}

export default StoreDashboardPage
