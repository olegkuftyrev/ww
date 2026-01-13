import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UsageCategory from './usage_category.js'

export default class UsageProduct extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare usageCategoryId: number

  @column()
  declare productNumber: string

  @column()
  declare productName: string

  @column()
  declare unit: string

  @column()
  declare w1: number | null

  @column()
  declare w2: number | null

  @column()
  declare w3: number | null

  @column()
  declare w4: number | null

  @column()
  declare average: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => UsageCategory)
  declare category: BelongsTo<typeof UsageCategory>
}
