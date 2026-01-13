import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Store from './store.js'
import UsageCategory from './usage_category.js'

export default class UsageEntry extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'store_id' })
  declare storeId: number

  @column.dateTime({ columnName: 'uploaded_at' })
  declare uploadedAt: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null

  @belongsTo(() => Store)
  declare store: BelongsTo<typeof Store>

  @hasMany(() => UsageCategory)
  declare categories: HasMany<typeof UsageCategory>
}
