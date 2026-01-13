import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { VisibilityState } from '@tanstack/react-table'

interface ColumnVisibilityToggleProps {
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (visibility: VisibilityState) => void
  columns: Array<{ id: string; label: string }>
}

export function ColumnVisibilityToggle({
  columnVisibility,
  onColumnVisibilityChange,
  columns,
}: ColumnVisibilityToggleProps) {
  const toggleColumn = (columnId: string) => {
    const currentValue = columnVisibility[columnId] ?? true
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: !currentValue,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Settings2 className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => {
          const isVisible = columnVisibility[column.id] ?? true
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={isVisible}
              onCheckedChange={() => toggleColumn(column.id)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
