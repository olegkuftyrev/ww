import { PageLayout } from '@/components/layout/page-layout'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PdfDropzone } from '@/components/common/pdf-dropzone'
import { type BreadcrumbItem, type PageProps } from '@/types'
import { usePage, router } from '@inertiajs/react'
import { parsePdf, type ParsedPdfData } from '@/lib/pdf-parser'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import * as React from 'react'

type StoreUsagePageProps = PageProps & {
  store: {
    id: number
    number: string
  }
}

const StoreUsagePage = () => {
  const { store } = usePage<StoreUsagePageProps>().props
  const [isParsing, setIsParsing] = React.useState(false)
  const [parsedData, setParsedData] = React.useState<ParsedPdfData | null>(null)

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

        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Upload PDF</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a PDF file to parse and review before sending to database
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
