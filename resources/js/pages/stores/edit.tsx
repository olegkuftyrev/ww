import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputError } from '@/components/common/input-error'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type BreadcrumbItem, type PageProps, type ValidationErrors } from '@/types'
import { usePage, useForm, router } from '@inertiajs/react'
import { LoaderCircle, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import * as React from 'react'

type User = {
  id: number
  name: string | null
  email: string
  role: 'associate' | 'manager' | 'admin'
  status: 'active' | 'inactive'
}

type EditStorePageProps = PageProps & {
  store: {
    id: number
    number: string
  }
  users: User[]
  storeUsers: User[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Stores',
    href: '/stores',
    id: 1,
  },
  {
    title: 'Edit Store',
    href: '#',
    id: 2,
  },
]

type EditStoreForm = {
  number: string
}

const EditStorePage = () => {
  const { flash, store, users, storeUsers } = usePage<EditStorePageProps>().props
  const { errors } = (flash || {}) as { errors: ValidationErrors }

  const { data, setData, put, processing } = useForm<EditStoreForm>({
    number: store.number,
  })

  const [selectedUserId, setSelectedUserId] = React.useState<string>('')
  const [isAddingUser, setIsAddingUser] = React.useState(false)
  const [isRemovingUser, setIsRemovingUser] = React.useState<number | null>(null)

  // Get users not already in the store
  const availableUsers = React.useMemo(() => {
    const storeUserIds = new Set(storeUsers.map((u) => u.id))
    return users.filter((user) => !storeUserIds.has(user.id))
  }, [users, storeUsers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const toastId = toast.loading('Updating store...')

    put(`/stores/${store.id}`, {
      onSuccess: () => {
        toast.success('Store updated successfully!', { id: toastId })
      },
      onError: (errors) => {
        const errorMessages: string[] = []
        if (errors.number) errorMessages.push(`Store Number: ${errors.number}`)

        const errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(', ')
            : 'An error occurred while updating store'
        toast.error(errorMessage, { id: toastId })
      },
    })
  }

  const handleAddUser = () => {
    if (!selectedUserId) {
      toast.error('Please select a user to add')
      return
    }

    setIsAddingUser(true)
    const toastId = toast.loading('Adding user to store...')

    router.post(
      `/stores/${store.id}/users`,
      { user_id: selectedUserId },
      {
        onSuccess: () => {
          toast.success('User added to store successfully!', { id: toastId })
          setSelectedUserId('')
        },
        onError: () => {
          toast.error('Failed to add user to store', { id: toastId })
        },
        onFinish: () => {
          setIsAddingUser(false)
        },
      }
    )
  }

  const handleRemoveUser = (userId: number) => {
    setIsRemovingUser(userId)
    const toastId = toast.loading('Removing user from store...')

    router.post(
      `/stores/${store.id}/users/remove`,
      { user_id: userId },
      {
        onSuccess: () => {
          toast.success('User removed from store successfully!', { id: toastId })
        },
        onError: () => {
          toast.error('Failed to remove user from store', { id: toastId })
        },
        onFinish: () => {
          setIsRemovingUser(null)
        },
      }
    )
  }

  return (
    <PageLayout breadcrumbs={breadcrumbs} pageTitle="Edit Store">
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
                Update Store
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

        {/* Users Management Section */}
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold">Store Users</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Manage users associated with this store
              </p>
            </div>

            {/* Add User Section */}
            {availableUsers.length > 0 && (
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="user-select">Add User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="user-select">
                      <SelectValue placeholder="Select a user to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name || user.email} ({user.email}) - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={handleAddUser}
                  disabled={isAddingUser || !selectedUserId}
                >
                  {isAddingUser && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            )}

            {/* Users Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storeUsers.length > 0 ? (
                    storeUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || '—'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="capitalize">{user.role}</span>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{user.status}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={isRemovingUser === user.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {isRemovingUser === user.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No users assigned to this store
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default EditStorePage
