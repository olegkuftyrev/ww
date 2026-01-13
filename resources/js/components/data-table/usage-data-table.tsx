import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
}

/**
 * Calculate variance category for color coding
 */
function getVarianceCategory(
  w1: number | null,
  w2: number | null,
  w3: number | null,
  w4: number | null
): 'red' | 'yellow' | 'normal' {
  const values = [w1, w2, w3, w4].filter((v) => v != null) as number[]

  if (values.length === 0) return 'normal'

  const max = Math.max(...values)
  const min = Math.min(...values)
  const difference = max - min

  if (difference > 3) return 'red'
  if (difference > 1) return 'yellow'
  return 'normal'
}

export function UsageDataTable<TData, TValue>({
  columns,
  data,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: onColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility: externalColumnVisibility || {},
      rowSelection,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-10 px-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                // Get variance category for row coloring
                const product = row.original as any
                const variance = getVarianceCategory(product.w1, product.w2, product.w3, product.w4)

                const rowClassName =
                  variance === 'red'
                    ? 'bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100'
                    : variance === 'yellow'
                      ? 'bg-yellow-50 border-l-4 border-l-yellow-500 hover:bg-yellow-100'
                      : ''

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={rowClassName}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
