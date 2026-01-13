import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Store from '#models/store'
import UsageEntry from '#models/usage_entry'

export default class CheckStoreData extends BaseCommand {
  static commandName = 'check:store-data'
  static description = 'Check if a store has usage data in the database'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Store number to check' })
  declare storeNumber: string

  async run() {
    this.logger.info(`Checking data for store: ${this.storeNumber}`)

    const store = await Store.findBy('number', this.storeNumber)

    if (!store) {
      this.logger.error(`Store ${this.storeNumber} not found`)
      return
    }

    this.logger.info(`Store ${this.storeNumber} found with ID: ${store.id}`)

    const usageEntry = await UsageEntry.query()
      .where('store_id', store.id)
      .preload('categories', (query) => {
        query.preload('products')
      })
      .first()

    if (!usageEntry) {
      this.logger.info(`No usage data found for store ${this.storeNumber}`)
      return
    }

    this.logger.info(`\nUsage Entry ID: ${usageEntry.id}`)
    this.logger.info(`Uploaded at: ${usageEntry.uploadedAt}`)
    this.logger.info(`Created at: ${usageEntry.createdAt}`)

    await usageEntry.load('categories')

    this.logger.info(`\nCategories: ${usageEntry.categories.length}`)

    for (const category of usageEntry.categories) {
      await category.load('products')
      this.logger.info(`\n${category.name}: ${category.products.length} products`)

      for (const product of category.products.slice(0, 3)) {
        this.logger.info(
          `  - ${product.productNumber}: ${product.productName} (${product.unit}) - W1: ${product.w1}, W2: ${product.w2}, W3: ${product.w3}, W4: ${product.w4}, Avg: ${product.average}`
        )
      }
      if (category.products.length > 3) {
        this.logger.info(`  ... and ${category.products.length - 3} more products`)
      }
    }

    this.logger.info(
      `\nStore ${this.storeNumber} has ${usageEntry.categories.length} categories with products`
    )
  }
}
