import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputError } from '@/components/common/input-error'
import { type BreadcrumbItem, type PageProps, type ValidationErrors } from '@/types'
import { usePage, useForm, router } from '@inertiajs/react'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Stores',
    href: '/stores',
    id: 1,
  },
  {
    title: 'Create Store',
    href: '/stores/create',
    id: 2,
  },
]

type CreateStoreForm = {
  number: string
}

const CreateStorePage = () => {
  const { flash } = usePage<PageProps>().props
  const { errors } = (flash || {}) as { errors: ValidationErrors }

  const { data, setData, post, processing } = useForm<CreateStoreForm>({
    number: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const toastId = toast.loading('Creating store...')

    post('/stores', {
      onSuccess: () => {
        toast.success('Store created successfully!', { id: toastId })
      },
      onError: (errors) => {
        const errorMessages: string[] = []
        if (errors.number) errorMessages.push(`Store Number: ${errors.number}`)

        const errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(', ')
            : 'An error occurred while creating store'
        toast.error(errorMessage, { id: toastId })
      },
    })
  }

  return (
    <PageLayout breadcrumbs={breadcrumbs} pageTitle="Create Store">
      <div className="w-full space-y-8 p-4">
        <div className="rounded-lg border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number">Store Number</Label>
                <Input
                  id="number"
                  type="text"
                  value={data.number}
                  onChange={(e) => setData('number', e.target.value)}
                  disabled={processing}
                  placeholder="Store #001"
                />
                <InputError message={errors?.number} />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={processing}>
                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                Create Store
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.get('/stores')}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  )
}

export default CreateStorePage
