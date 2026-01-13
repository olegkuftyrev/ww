import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import UsageEntry from './usage_entry.js'
import UsageProduct from './usage_product.js'

export default class UsageCategory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare usageEntryId: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => UsageEntry)
  declare usageEntry: BelongsTo<typeof UsageEntry>

  @hasMany(() => UsageProduct)
  declare products: HasMany<typeof UsageProduct>
}
