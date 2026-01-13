import { PageLayout } from '@/components/layout/page-layout'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PdfDropzone } from '@/components/common/pdf-dropzone'
import { type BreadcrumbItem, type PageProps } from '@/types'
import { usePage, router } from '@inertiajs/react'
import { parsePdf, type ParsedPdfData } from '@/lib/pdf-parser'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import * as React from 'react'
import { UsageDataTable } from '@/components/data-table/usage-data-table'
import { createUsageColumns } from '@/components/data-table/usage-columns'
import { Separator } from '@/components/ui/separator'

type ExistingUsageData = {
  uploadedAt: string
  categories: {
    name: string
    products: {
      productNumber: string
      productName: string
      unit: string
      w1: number | null
      w2: number | null
      w3: number | null
      w4: number | null
      average: number | null
      conversion: number | null
    }[]
  }[]
}

type StoreUsagePageProps = PageProps & {
  store: {
    id: number
    number: string
  }
  existingData: ExistingUsageData | null
}

const StoreUsagePage = () => {
  const { store, existingData } = usePage<StoreUsagePageProps>().props
  const [isParsing, setIsParsing] = React.useState(false)
  const [parsedData, setParsedData] = React.useState<ParsedPdfData | null>(null)
  const [multiplier, setMultiplier] = React.useState(10)

  const breadcrumbs: BreadcrumbItem[] = [
    {
      id: 1,
      title: `Store ${store.number}`,
      href: `/stores/${store.id}`,
    },
    {
      id: 2,
      title: '1K Usage',
      href: `/stores/${store.id}/usage`,
    },
  ]

  const handleFileSelect = async (file: File) => {
    setIsParsing(true)
    const toastId = toast.loading('Parsing PDF...')

    try {
      const data = await parsePdf(file)
      setParsedData(data)
      toast.success('PDF parsed successfully!', { id: toastId })
    } catch (error: any) {
      console.error('Error parsing PDF:', error)
      toast.error(`Error parsing PDF: ${error.message}`, { id: toastId })
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = () => {
    if (!parsedData) {
      toast.error('No data to submit')
      return
    }

    const toastId = toast.loading('Saving to database...')

    // Transform parsed data to match backend validator format
    const submitData = {
      categories: parsedData.categories.map((category) => ({
        name: category.name,
        products: category.products.map((product) => ({
          productNumber: product.productNumber,
          product: product.product,
          unit: product.unit,
          weeks: {
            w1: product.weeks.w1 || null,
            w2: product.weeks.w2 || null,
            w3: product.weeks.w3 || null,
            w4: product.weeks.w4 || null,
          },
          average: product.average || null,
          conversion: product.conversion || null,
        })),
      })),
    }

    router.post(`/stores/${store.id}/usage/store`, submitData, {
      onSuccess: () => {
        toast.success('Usage data saved successfully!', { id: toastId })
      },
      onError: (errors) => {
        console.error('Error saving usage data:', errors)
        const errorMessage = errors.general || 'Failed to save usage data'
        toast.error(errorMessage, { id: toastId })
      },
      onFinish: () => {
        // Optionally clear parsed data after successful submission
      },
    })
  }

  return (
    <PageLayout breadcrumbs={breadcrumbs} pageTitle={`Store ${store.number} - 1K Usage`}>
      <div className="w-full space-y-8 p-4">
        <div>
          <Label className="text-3xl font-bold">1K Usage</Label>
          <p className="text-muted-foreground mt-2">
            Track and manage usage metrics for Store {store.number}
          </p>
        </div>

        {existingData && (
          <div className="space-y-4">
            <div>
              <Label className="text-2xl font-semibold">Current Usage Data</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Last uploaded:{' '}
                {new Date(existingData.uploadedAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            {existingData.categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="text-xl font-semibold">{category.name}</Label>
                  <span className="text-sm text-muted-foreground">
                    {category.products.length} products
                  </span>
                </div>
                {category.products.length > 0 ? (
                  <UsageDataTable
                    columns={createUsageColumns(multiplier)}
                    data={category.products}
                    multiplier={multiplier}
                    onMultiplierChange={setMultiplier}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground p-4">No products found</p>
                )}
                {categoryIndex < existingData.categories.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-2xl font-semibold">
              {existingData ? 'Upload New Usage Data' : 'Upload Usage Data'}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a PDF file to parse and review before sending to database
              {existingData && ' (This will replace the existing data)'}
            </p>
          </div>
          <PdfDropzone onFileSelect={handleFileSelect} disabled={isParsing} />

          {isParsing && (
            <div className="flex items-center justify-center p-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Parsing PDF...</span>
            </div>
          )}

          {parsedData && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <div className="mb-4">
                  <Label className="text-xl font-semibold">Parsed Data Preview</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Store Number: {parsedData.storeNumber || 'Not found'}
                  </p>
                </div>

                <div className="space-y-6">
                  {parsedData.categories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="space-y-2">
                      <Label className="text-lg font-semibold">{category.name}</Label>
                      {category.products.length > 0 ? (
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product Number</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>W1</TableHead>
                                <TableHead>W2</TableHead>
                                <TableHead>W3</TableHead>
                                <TableHead>W4</TableHead>
                                <TableHead>Average</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {category.products.map((product, productIndex) => (
                                <TableRow key={productIndex}>
                                  <TableCell className="font-medium">
                                    {product.productNumber}
                                  </TableCell>
                                  <TableCell>{product.product}</TableCell>
                                  <TableCell>{product.unit}</TableCell>
                                  <TableCell>{product.weeks.w1 || '—'}</TableCell>
                                  <TableCell>{product.weeks.w2 || '—'}</TableCell>
                                  <TableCell>{product.weeks.w3 || '—'}</TableCell>
                                  <TableCell>{product.weeks.w4 || '—'}</TableCell>
                                  <TableCell>{product.average || '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4">No products found</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={!parsedData}>
                  Submit to Database
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

export default StoreUsagePage
