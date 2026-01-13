import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UsageCategory from './usage_category.js'

export default class UsageProduct extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'usage_category_id' })
  declare usageCategoryId: number

  @column({ columnName: 'product_number' })
  declare productNumber: string

  @column({ columnName: 'product_name' })
  declare productName: string

  @column()
  declare unit: string

  @column({ columnName: 'w1' })
  declare w1: number | null

  @column({ columnName: 'w2' })
  declare w2: number | null

  @column({ columnName: 'w3' })
  declare w3: number | null

  @column({ columnName: 'w4' })
  declare w4: number | null

  @column()
  declare average: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null

  @belongsTo(() => UsageCategory)
  declare category: BelongsTo<typeof UsageCategory>
}
