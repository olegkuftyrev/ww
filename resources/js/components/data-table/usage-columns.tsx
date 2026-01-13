import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Input } from '@/components/ui/input'
import * as React from 'react'

export type UsageProduct = {
  productNumber: string
  productName: string
  unit: string
  w1: number | null
  w2: number | null
  w3: number | null
  w4: number | null
  average: number | null
  conversion: number | null
}

function ConversionCell({ initialValue }: { initialValue: number | null }) {
  const value = initialValue?.toString() || '1'

  return (
    <Input
      type="number"
      step="0.01"
      value={value}
      readOnly
      disabled
      className="h-8 w-20 text-right cursor-not-allowed bg-muted"
      title="Conversion factor is predefined for this product"
    />
  )
}

export const createUsageColumns = (multiplier: number): ColumnDef<UsageProduct>[] => [
  {
    accessorKey: 'productNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product #" />,
    cell: ({ row }) => <div className="font-medium text-xs">{row.getValue('productNumber')}</div>,
  },
  {
    accessorKey: 'productName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue('productName')}</div>,
  },
  {
    accessorKey: 'conversion',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Conversion" />,
    cell: ({ row }) => {
      const value = row.getValue<number | null>('conversion')
      return <ConversionCell initialValue={value} />
    },
  },
  {
    accessorKey: 'unit',
    header: 'Unit',
    cell: ({ row }) => <div className="text-center text-xs">{row.getValue('unit')}</div>,
  },
  {
    accessorKey: 'w1',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="W38 '25" className="justify-end" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<number | null>('w1')
      return (
        <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
      )
    },
  },
  {
    accessorKey: 'w2',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="W39 '25" className="justify-end" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<number | null>('w2')
      return (
        <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
      )
    },
  },
  {
    accessorKey: 'w3',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="W40 '25" className="justify-end" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<number | null>('w3')
      return (
        <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
      )
    },
  },
  {
    accessorKey: 'w4',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="W41 '25" className="justify-end" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<number | null>('w4')
      return (
        <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
      )
    },
  },
  {
    accessorKey: 'average',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="AVG4" className="justify-end" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<number | null>('average')
      return (
        <div className="text-right font-medium text-xs">
          {value != null ? Number(value).toFixed(2) : '—'}
        </div>
      )
    },
  },
  {
    id: 'csPer1k',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CS per 1k" className="justify-end" />
    ),
    cell: ({ row }) => {
      const average = row.getValue<number | null>('average')
      const conversion = row.original.conversion
      const avgNum = average != null ? Number(average) : null
      const convNum = conversion != null ? Number(conversion) : null
      const csPer1k = avgNum && convNum && convNum > 0 ? avgNum / convNum : null
      return (
        <div className="text-right font-medium text-xs">
          {csPer1k != null ? csPer1k.toFixed(2) : '—'}
        </div>
      )
    },
  },
  {
    id: 'volumeMultiplier',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Volume Multiplier" className="justify-end" />
    ),
    cell: ({ row }) => {
      const average = row.getValue<number | null>('average')
      const conversion = row.original.conversion
      const avgNum = average != null ? Number(average) : null
      const convNum = conversion != null ? Number(conversion) : null
      const csPer1k = avgNum && convNum && convNum > 0 ? avgNum / convNum : null
      const volumeMultiplier = csPer1k != null ? csPer1k * multiplier : null
      return (
        <div className="text-right font-medium text-xs">
          {volumeMultiplier != null ? volumeMultiplier.toFixed(2) : '—'}
        </div>
      )
    },
  },
]
