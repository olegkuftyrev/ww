import * as React from 'react'
import { Store, Users } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { TeamSwitcher } from './team-switcher'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'
import { type NavItem, type SharedProps } from '@/types'
import { usePage } from '@inertiajs/react'

const secondaryNavItems: NavItem[] = [
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    type: 'internal',
    adminOnly: true,
  },
  {
    title: 'Stores',
    href: '/stores',
    icon: Store,
    type: 'internal',
    adminOnly: true,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = usePage<SharedProps>().props

  // Generate store nav items from user's stores
  const storeNavItems: NavItem[] = React.useMemo(() => {
    if (!user?.stores || user.stores.length === 0) {
      return []
    }

    return user.stores.map((store) => ({
      title: store.number,
      href: `/stores/${store.id}`,
      icon: Store,
      type: 'internal' as const,
    }))
  }, [user?.stores])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={storeNavItems} />
        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
