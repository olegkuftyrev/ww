import * as pdfjsLib from 'pdfjs-dist'

// Set up the worker for PDF.js
// Using local worker file from public directory (no CDN dependency)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
}

export interface ParsedPdfData {
  storeNumber: string
  categories: PdfCategory[]
}

export interface PdfCategory {
  name: string
  products: PdfProduct[]
}

export interface PdfProduct {
  productNumber: string
  product: string
  unit: string
  weeks: {
    w1?: string
    w2?: string
    w3?: string
    w4?: string
  }
  average: string
}

export async function parsePdf(file: File): Promise<ParsedPdfData> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  // Extract text from all pages with better formatting
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    // Extract text with position information for better parsing
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
  }

  // Log raw text for debugging (remove in production)
  console.log('Extracted PDF text (first 2000 chars):', fullText.substring(0, 2000))

  // Parse the text to extract structured data
  const parsedData = parsePdfText(fullText)

  return parsedData
}

function parsePdfText(text: string): ParsedPdfData {
  // Extract store number (e.g., "Store 1020")
  const storeMatch = text.match(/Store\s+(\d+)/i)
  const storeNumber = storeMatch ? storeMatch[1] : ''

  // Category patterns - note: categories appear AFTER their products in the PDF
  const categoryPatterns = [
    { pattern: /Store\s+\d+\s+Meat\s+Inventory\s+Usage\s+per\s+\$1000/i, name: 'Meat' },
    { pattern: /Store\s+\d+\s+Seafood\s+Inventory\s+Usage\s+per\s+\$1000/i, name: 'Seafood' },
    { pattern: /Store\s+\d+\s+Produce\s+Inventory\s+Usage\s+per\s+\$1000/i, name: 'Produce' },
    { pattern: /Store\s+\d+\s+Grocery\s+Inventory\s+Usage\s+per\s+\$1000/i, name: 'Grocery' },
    { pattern: /Store\s+\d+\s+Paper\s+Inventory\s+Usage\s+per\s+\$1000/i, name: 'Paper' },
    { pattern: /Store\s+\d+\s+Condiments\s+Inventory\s+Usage\s+per\s+\$1000/i, name: 'Condiments' },
    {
      pattern: /Store\s+\d+\s+Other\s+Cogs\s+Inventory\s+Usage\s+per\s+\$1000/i,
      name: 'Other Cogs',
    },
  ]

  // Find all category positions (they appear after their products)
  const categoryPositions: Array<{ index: number; name: string }> = []
  for (const catInfo of categoryPatterns) {
    const match = text.match(catInfo.pattern)
    if (match && match.index !== undefined) {
      categoryPositions.push({
        index: match.index,
        name: catInfo.name,
      })
    }
  }

  // Sort categories by position in text
  categoryPositions.sort((a, b) => a.index - b.index)

  // Parse all products (format: P10002   Chicken, Orange Dark Battered K-   LB   19.26   20.97   19.09   20.17   19.90)
  // Pattern matches: P followed by digits, product name (can contain commas, hyphens, spaces), unit, then 5 numeric values
  const allProducts: Array<{ product: PdfProduct; position: number }> = []
  const productPattern =
    /(P\d+)\s+([A-Za-z][^P]+?)\s+(LB|CT|GAL|PX|BOTL)\s+([\d().-]+)\s+([\d().-]+)\s+([\d().-]+)\s+([\d().-]+)\s+([\d().-]+)/g

  let match
  while ((match = productPattern.exec(text)) !== null) {
    if (match.index !== undefined) {
      // Clean up product name - remove trailing spaces and common separators
      let productName = match[2].trim()
      // Remove trailing K- if it's part of the product name pattern
      productName = productName.replace(/\s+K-\s*$/, '').trim()

      allProducts.push({
        product: {
          productNumber: match[1].trim(),
          product: productName,
          unit: match[3].trim(),
          weeks: {
            w1: match[4].trim().replace(/[()]/g, ''),
            w2: match[5].trim().replace(/[()]/g, ''),
            w3: match[6].trim().replace(/[()]/g, ''),
            w4: match[7].trim().replace(/[()]/g, ''),
          },
          average: match[8].trim(),
        },
        position: match.index,
      })
    }
  }

  // Assign products to categories based on position
  // Products appear BEFORE their category header, so:
  // - Products from start to first category header → first category
  // - Products from first category header to second category header → second category
  // - etc.
  const categories: PdfCategory[] = categoryPatterns.map((catInfo) => {
    const catPosition = categoryPositions.find((cp) => cp.name === catInfo.name)

    if (!catPosition) {
      return { name: catInfo.name, products: [] }
    }

    // Find the previous category header position (or start of text)
    const prevCategory = categoryPositions
      .filter((cp) => cp.index < catPosition.index)
      .sort((a, b) => b.index - a.index)[0]
    const startPosition = prevCategory ? prevCategory.index : 0

    // Products between previous category header (or start) and this category header belong to this category
    const categoryProducts = allProducts
      .filter((p) => p.position >= startPosition && p.position < catPosition.index)
      .map((p) => p.product)

    return {
      name: catInfo.name,
      products: categoryProducts,
    }
  })

  return {
    storeNumber,
    categories,
  }
}
