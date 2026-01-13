import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import UsageProduct from '#models/usage_product'

// Conversion lookup table
const PRODUCT_CONVERSIONS: Record<string, number> = {
  // Meat
  P10002: 40,
  P10028: 40,
  P10019: 40,
  P10027: 40,
  P10008: 40,
  P10018: 20,
  P5020: 40,
  P5017: 30,
  P5007: 40,
  // Seafood
  P16032: 20,
  // Produce
  P19149: 32,
  P19013: 20,
  P19909: 30,
  P19055: 40,
  P19048: 50,
  P19186: 20,
  P19016: 50,
  P19045: 10,
  P19085: 30,
  P19169: 18,
  P19910: 11,
  P19187: 4,
  P19147: 12,
  P19046: 8,
  // Grocery
  P1079: 400,
  P1102: 30,
  P1260: 100,
  P1112: 50,
  P1107: 35,
  P1001: 200,
  P1004: 60,
  P1129: 50,
  P1684: 125,
  P19054: 20,
  P1249: 32,
  P2002: 30,
  P1404: 40,
  P1295: 35,
  P1792: 40,
  P1580: 40,
  P1116: 4.8,
  P1158: 6,
  P1272: 50,
  P19052: 6,
  P1093: 12,
  P1268: 40,
  P1131: 4,
  P1233: 40,
  P19002: 20,
  // Paper - Beverages
  P25980: 32,
  P25911: 24,
  P25973: 24,
  P25959: 24,
  P25908: 24,
  P25341: 24,
  P25353: 50,
  P25422: 12,
  P25421: 12,
  P25424: 12,
  P25423: 12,
  P25004: 5,
  P25003: 5,
  P25005: 5,
  P25027: 5,
  P25943: 5,
  P25346: 5,
  P25006: 5,
  P25933: 5,
  P25077: 5,
  P25244: 5,
  P25403: 24,
  // Paper - Disposables
  P35432: 7200,
  P35048: 2000,
  P35719: 200,
  P35213: 2000,
  P35509: 504,
  P36029: 250,
  P35508: 504,
  P35149: 1000,
  P35130: 450,
  P35062: 2000,
  P35580: 3000,
  P35275: 1000,
  P35542: 1500,
  P35040: 1000,
  P35094: 500,
  P35406: 1000,
  P35081: 450,
  P35268: 750,
  P35380: 600,
  P35634: 300,
  P35659: 1000,
  P35065: 1000,
  P35126: 450,
  P35269: 600,
  // Condiments
  P1124: 1000,
  P1151: 700,
  P1652: 500,
  P1566: 311,
  P23001: 500,
}

export default class UpdateProductConversions extends BaseCommand {
  static commandName = 'update:product-conversions'
  static description = 'Update conversion values for all existing usage products'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting to update product conversions...')

    const products = await UsageProduct.all()
    let updatedCount = 0
    let skippedCount = 0

    for (const product of products) {
      const conversion = PRODUCT_CONVERSIONS[product.productNumber]

      if (conversion !== undefined) {
        product.conversion = conversion
        await product.save()
        updatedCount++
        this.logger.info(
          `Updated ${product.productNumber} (${product.productName}) to conversion: ${conversion}`
        )
      } else {
        skippedCount++
        this.logger.warning(`No conversion found for ${product.productNumber}`)
      }
    }

    this.logger.success(
      `\nCompleted! Updated ${updatedCount} products, skipped ${skippedCount} products`
    )
  }
}
