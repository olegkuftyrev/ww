import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import Store from './store.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare email: string

  @column()
  declare role: 'associate' | 'manager' | 'admin'

  @column()
  declare theme: 'dark' | 'light' | 'system' | 'iron-man'

  @column()
  declare status: 'active' | 'inactive'

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => Store, {
    localKey: 'id',
    relatedKey: 'id',
    pivotTable: 'user_stores',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'store_id',
  })
  declare stores: ManyToMany<typeof Store>

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}
