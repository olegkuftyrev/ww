import { PageLayout } from '@/components/layout/page-layout'
import { SettingsLayout } from '@/components/layout/settings-layout'
import { InputError } from '@/components/common/input-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROFILE_UPDATE_API } from '@/lib/constants'
import { type BreadcrumbItem, type PageProps, type ValidationErrors } from '@/types'
import { usePage, useForm } from '@inertiajs/react'
import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Profile settings',
    href: '/settings/profile',
    id: 1,
  },
]

type ProfileForm = {
  name: string
  email: string
  role: 'associate' | 'manager' | 'admin'
}

const ProfilePage = () => {
  const { user, flash } = usePage<PageProps>().props
  const { errors } = (flash || {}) as { errors: ValidationErrors }

  const { data, setData, put, processing } = useForm<ProfileForm>({
    name: user?.name || '',
    email: user?.email || '',
    role: (user?.role as 'associate' | 'manager' | 'admin') || 'associate',
  })

  const nameFieldRef = useRef<{ lastSavedValue: string }>({ lastSavedValue: user?.name || '' })
  const emailFieldRef = useRef<{ lastSavedValue: string }>({ lastSavedValue: user?.email || '' })

  // Обновляем refs при изменении user из props
  useEffect(() => {
    if (user?.name) {
      nameFieldRef.current.lastSavedValue = user.name
    }
    if (user?.email) {
      emailFieldRef.current.lastSavedValue = user.email
    }
  }, [user])

  const handleBlur = (field: 'name' | 'email') => {
    const currentValue = data[field]
    const lastSavedValue =
      field === 'name' ? nameFieldRef.current.lastSavedValue : emailFieldRef.current.lastSavedValue

    // Сохраняем только если значение изменилось
    if (currentValue !== lastSavedValue && currentValue.trim() !== '') {
      const fieldName = field === 'name' ? 'Name' : 'Email'
      const toastId = toast.loading(`Updating ${fieldName.toLowerCase()}...`)

      put(PROFILE_UPDATE_API, {
        preserveScroll: true,
        onSuccess: () => {
          // Обновляем последнее сохраненное значение
          if (field === 'name') {
            nameFieldRef.current.lastSavedValue = currentValue
          } else {
            emailFieldRef.current.lastSavedValue = currentValue
          }
          toast.success(`${fieldName} updated successfully`, { id: toastId })
        },
        onError: (errors) => {
          // Errors are handled by flash messages
          const errorMessage = errors[field] || 'An error occurred while updating'
          toast.error(`${fieldName}: ${errorMessage}`, { id: toastId })
        },
      })
    }
  }

  return (
    <PageLayout breadcrumbs={breadcrumbs} pageTitle="Profile settings">
      <SettingsLayout>
        <section className="w-full space-y-8 lg:w-3/4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    user?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium capitalize">{user?.status || 'active'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                disabled={processing}
              />
              <InputError message={errors?.name} />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground flex items-center gap-1.5"
              >
                <Lock className="h-3 w-3" />
                Email address
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="user@email.com"
                value={data.email}
                disabled={true}
                readOnly
              />
              <InputError message={errors?.email} />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-xs text-muted-foreground flex items-center gap-1.5"
              >
                <Lock className="h-3 w-3" />
                Role
              </Label>
              <Select value={data.role} disabled={true}>
                <SelectTrigger id="role" className="w-full">
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
          </div>
        </section>
      </SettingsLayout>
    </PageLayout>
  )
}

export default ProfilePage
