'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MenuSchema extends Schema {
  up () {
    this.create('menus', (table) => {
      table.increments()
      table.string('name', 254).notNullable()
      table.string('url', 254).notNullable()
      table.string('section', 254)
      table.string('icon', 254)
      table.integer('status', 11).notNullable().defaultTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('menus')
  }
}

module.exports = MenuSchema
