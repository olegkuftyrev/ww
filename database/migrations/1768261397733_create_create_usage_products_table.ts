import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'usage_products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('usage_category_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('usage_categories')
        .onDelete('CASCADE')
      table.string('product_number').notNullable()
      table.string('product_name').notNullable()
      table.string('unit').notNullable()
      table.decimal('w1', 10, 2).nullable()
      table.decimal('w2', 10, 2).nullable()
      table.decimal('w3', 10, 2).nullable()
      table.decimal('w4', 10, 2).nullable()
      table.decimal('average', 10, 2).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
