import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'usage_products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('conversion', 10, 2).nullable().defaultTo(1)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('conversion')
    })
  }
}
