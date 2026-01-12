import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InputError } from '@/components/common/input-error'
import { type BreadcrumbItem, type PageProps, type ValidationErrors } from '@/types'
import { usePage, useForm, router } from '@inertiajs/react'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

type EditUserPageProps = PageProps & {
  user: {
    id: number
    name: string | null
    email: string
    role: 'associate' | 'manager' | 'admin'
    status: 'active' | 'inactive'
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Users',
    href: '/users',
    id: 1,
  },
  {
    title: 'Edit User',
    href: '#',
    id: 2,
  },
]

type EditUserForm = {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: 'associate' | 'manager' | 'admin'
  status: 'active' | 'inactive'
}

const EditUserPage = () => {
  const { flash, user } = usePage<EditUserPageProps>().props
  const { errors } = (flash || {}) as { errors: ValidationErrors }

  const { data, setData, put, processing } = useForm<EditUserForm>({
    name: user.name || '',
    email: user.email,
    password: '',
    password_confirmation: '',
    role: user.role,
    status: user.status,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const toastId = toast.loading('Updating user...')

    put(`/users/${user.id}`, {
      onSuccess: () => {
        toast.success('User updated successfully!', { id: toastId })
      },
      onError: (errors) => {
        const errorMessages: string[] = []
        if (errors.name) errorMessages.push(`Name: ${errors.name}`)
        if (errors.email) errorMessages.push(`Email: ${errors.email}`)
        if (errors.password) errorMessages.push(`Password: ${errors.password}`)
        if (errors.password_confirmation)
          errorMessages.push(`Password confirmation: ${errors.password_confirmation}`)
        if (errors.role) errorMessages.push(`Role: ${errors.role}`)
        if (errors.status) errorMessages.push(`Status: ${errors.status}`)

        const errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(', ')
            : 'An error occurred while updating user'
        toast.error(errorMessage, { id: toastId })
      },
    })
  }

  return (
    <PageLayout breadcrumbs={breadcrumbs} pageTitle="Edit User">
      <div className="w-full space-y-8 p-4">
        <div className="rounded-lg border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  disabled={processing}
                  placeholder="John Doe"
                />
                <InputError message={errors?.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  disabled={processing}
                  placeholder="user@example.com"
                />
                <InputError message={errors?.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (leave blank to keep current)</Label>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  disabled={processing}
                  placeholder="••••••••"
                />
                <InputError message={errors?.password} />
                <p className="text-xs text-muted-foreground">
                  Leave blank if you don't want to change the password
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  disabled={processing}
                  placeholder="••••••••"
                />
                <InputError message={errors?.password_confirmation} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={data.role}
                  onValueChange={(value) => setData('role', value as EditUserForm['role'])}
                  disabled={processing}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="associate">Associate</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <InputError message={errors?.role} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={data.status}
                  onValueChange={(value) => setData('status', value as EditUserForm['status'])}
                  disabled={processing}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <InputError message={errors?.status} />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={processing}>
                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                Update User
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.get('/users')}
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

export default EditUserPage
