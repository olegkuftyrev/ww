import vine from '@vinejs/vine'

/**
 * Validates store usage data submission
 */
export const storeUsageValidator = vine.compile(
  vine.object({
    categories: vine.array(
      vine.object({
        name: vine.string().trim(),
        products: vine.array(
          vine.object({
            productNumber: vine.string().trim(),
            product: vine.string().trim(),
            unit: vine.string().trim(),
            weeks: vine.object({
              w1: vine.string().nullable().optional(),
              w2: vine.string().nullable().optional(),
              w3: vine.string().nullable().optional(),
              w4: vine.string().nullable().optional(),
            }),
            average: vine.string().nullable().optional(),
          })
        ),
      })
    ),
  })
)
