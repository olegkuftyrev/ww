import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'

export type UsageProduct = {
  id?: number
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

interface EditableWeekCellProps {
  initialValue: number | null
  productId: number
  weekField: 'w1' | 'w2' | 'w3' | 'w4'
  storeId: number
}

function EditableWeekCell({ initialValue, productId, weekField, storeId }: EditableWeekCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [value, setValue] = React.useState(initialValue?.toString() || '')
  const [isSaving, setIsSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Sync value with initialValue when it changes (after data reload)
  React.useEffect(() => {
    if (!isEditing && !isSaving) {
      setValue(initialValue?.toString() || '')
    }
  }, [initialValue, isEditing, isSaving])

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleSave = async () => {
    if (isSaving) return // Prevent multiple saves

    if (value === initialValue?.toString()) {
      setIsEditing(false)
      return
    }

    const numericValue = value ? parseFloat(value) : null
    if (isNaN(numericValue as number) && numericValue !== null) {
      toast.error('Invalid number')
      setValue(initialValue?.toString() || '')
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    const toastId = toast.loading('Saving...')

    router.patch(
      `/stores/${storeId}/usage/products/${productId}`,
      {
        [weekField]: numericValue,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          toast.success('Value updated! Average recalculated.', { id: toastId })
          setIsEditing(false)
          setIsSaving(false)
          // Reload only the existingData prop after editing is complete
          // Use a delay to ensure the backend has processed the update
          saveTimeoutRef.current = setTimeout(() => {
            router.reload({ only: ['existingData'], preserveScroll: true, preserveState: true })
          }, 500)
        },
        onError: (errors) => {
          toast.error('Failed to update value', { id: toastId })
          console.error(errors)
          setValue(initialValue?.toString() || '')
          setIsEditing(false)
          setIsSaving(false)
        },
      }
    )
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only save if we're not clicking on another input
    // This prevents saving when clicking between cells
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget.tagName === 'INPUT') {
      // User is clicking on another input, don't save yet
      return
    }
    handleSave()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setValue(initialValue?.toString() || '')
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="h-7 w-20 text-right text-xs"
      />
    )
  }

  return (
    <div
      className="text-right text-xs cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
      onDoubleClick={() => setIsEditing(true)}
      title="Double-click to edit"
    >
      {initialValue != null ? Number(initialValue).toFixed(2) : '—'}
    </div>
  )
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

export const createUsageColumns = (
  multiplier: number,
  storeId: number
): ColumnDef<UsageProduct>[] => [
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
      const productId = row.original.id
      if (!productId) {
        return (
          <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
        )
      }
      return (
        <EditableWeekCell
          initialValue={value}
          productId={productId}
          weekField="w1"
          storeId={storeId}
        />
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
      const productId = row.original.id
      if (!productId) {
        return (
          <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
        )
      }
      return (
        <EditableWeekCell
          initialValue={value}
          productId={productId}
          weekField="w2"
          storeId={storeId}
        />
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
      const productId = row.original.id
      if (!productId) {
        return (
          <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
        )
      }
      return (
        <EditableWeekCell
          initialValue={value}
          productId={productId}
          weekField="w3"
          storeId={storeId}
        />
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
      const productId = row.original.id
      if (!productId) {
        return (
          <div className="text-right text-xs">{value != null ? Number(value).toFixed(2) : '—'}</div>
        )
      }
      return (
        <EditableWeekCell
          initialValue={value}
          productId={productId}
          weekField="w4"
          storeId={storeId}
        />
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="CS per 1k" />,
    cell: ({ row }) => {
      const average = row.getValue<number | null>('average')
      const conversion = row.original.conversion
      const avgNum = average != null ? Number(average) : null
      const convNum = conversion != null ? Number(conversion) : null
      const csPer1k = avgNum && convNum && convNum > 0 ? avgNum / convNum : null
      return <div>{csPer1k != null ? csPer1k.toFixed(2) : '—'}</div>
    },
  },
  {
    id: 'volumeMultiplier',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Volume Multiplier" />,
    cell: ({ row }) => {
      const average = row.getValue<number | null>('average')
      const conversion = row.original.conversion
      const avgNum = average != null ? Number(average) : null
      const convNum = conversion != null ? Number(conversion) : null
      const csPer1k = avgNum && convNum && convNum > 0 ? avgNum / convNum : null
      const volumeMultiplier = csPer1k != null ? csPer1k * multiplier : null
      return <div>{volumeMultiplier != null ? volumeMultiplier.toFixed(2) : '—'}</div>
    },
  },
]
