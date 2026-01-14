import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Store from '#models/store'
import UsageEntry from '#models/usage_entry'
import UsageProduct from '#models/usage_product'

export default class CheckProduct extends BaseCommand {
  static commandName = 'check:product'
  static description = 'Check product data and calculations for debugging'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Store number', default: '1020' })
  declare storeNumber: string

  @args.string({ description: 'Product number', default: 'P10028' })
  declare productNumber: string

  async run() {
    const storeNumber = this.storeNumber || '1020'
    const productNumber = this.productNumber || 'P10028'

    // Find store
    const store = await Store.findBy('number', storeNumber)
    if (!store) {
      this.logger.error(`Store ${storeNumber} not found`)
      return
    }

    this.logger.info(`Found store: ${store.number} (ID: ${store.id})`)

    // Find latest usage entry for this store
    const usageEntry = await UsageEntry.query()
      .where('store_id', store.id)
      .preload('categories', (query) => {
        query.preload('products')
      })
      .orderBy('uploaded_at', 'desc')
      .first()

    if (!usageEntry) {
      this.logger.error(`No usage entry found for store ${storeNumber}`)
      return
    }

    this.logger.info(`Found usage entry: ID ${usageEntry.id}, uploaded at ${usageEntry.uploadedAt}`)

    // Find the product
    let product: UsageProduct | null = null
    for (const category of usageEntry.categories) {
      product = category.products.find((p) => p.productNumber === productNumber) || null
      if (product) break
    }

    if (!product) {
      this.logger.error(`Product ${productNumber} not found in store ${storeNumber}`)
      return
    }

    this.logger.info(`\n=== Product ${productNumber} Data ===`)
    this.logger.info(`ID: ${product.id}`)
    this.logger.info(`Product Name: ${product.productName}`)
    this.logger.info(`Unit: ${product.unit}`)
    this.logger.info(`Conversion: ${product.conversion}`)
    this.logger.info(`W1: ${product.w1}`)
    this.logger.info(`W2: ${product.w2}`)
    this.logger.info(`W3: ${product.w3}`)
    this.logger.info(`W4: ${product.w4}`)
    this.logger.info(`Average (stored): ${product.average}`)

    // Calculate average manually
    const weekValues = [product.w1, product.w2, product.w3, product.w4].filter(
      (v) => v !== null && v !== undefined
    ) as number[]

    if (weekValues.length > 0) {
      const calculatedAverage = weekValues.reduce((sum, val) => sum + val, 0) / weekValues.length
      this.logger.info(`Average (calculated): ${calculatedAverage}`)
      this.logger.info(
        `Average match: ${product.average === calculatedAverage ? '✓' : '✗ (MISMATCH!)'}`
      )
    }

    // Calculate CS per 1k
    if (product.average && product.conversion && product.conversion > 0) {
      const csPer1k = product.average / product.conversion
      this.logger.info(`CS per 1k: ${csPer1k.toFixed(2)}`)
    } else {
      this.logger.info(
        `CS per 1k: Cannot calculate (average: ${product.average}, conversion: ${product.conversion})`
      )
    }

    // Calculate Volume Multiplier (using 12k as default)
    const multiplier = 12
    if (product.average && product.conversion && product.conversion > 0) {
      const csPer1k = product.average / product.conversion
      const volumeMultiplier = csPer1k * multiplier
      this.logger.info(`Volume Multiplier (${multiplier}k): ${volumeMultiplier.toFixed(2)}`)
    }
  }
}
