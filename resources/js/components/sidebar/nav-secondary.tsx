import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { type SharedProps, type NavItem } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { Icon } from '../common/icon'

export const NavSecondary = ({
  items,
  ...props
}: {
  items: NavItem[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) => {
  const page = usePage<SharedProps>()
  const user = page.props.user

  // Фильтруем элементы, показывая adminOnly только для админов
  const filteredItems = items.filter((item) => {
    if (item.adminOnly) {
      return user?.role === 'admin'
    }
    return true
  })

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                {item.type === 'internal' ? (
                  <Link href={item.href} prefetch>
                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                    <span>{item.title}</span>
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
