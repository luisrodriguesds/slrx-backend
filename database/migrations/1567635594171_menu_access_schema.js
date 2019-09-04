'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MenuAccessSchema extends Schema {
  up () {
    this.create('menu_accesses', (table) => {
      table.increments()
      table
          .integer('menu_id', 11)
          .unsigned()
          .references('id')
          .inTable('menus')
          .onUpdate('CASCADE')
          .onDelete('CASCADE')
      table
          .integer('access_id', 11)
          .unsigned()
          .references('id')
          .inTable('access_levels')
          .onUpdate('CASCADE')
          .onDelete('CASCADE')
      table.integer('status', 11).notNullable().defaultTo(1)      
      table.timestamps()
    })
  }

  down () {
    this.drop('menu_accesses')
  }
}

module.exports = MenuAccessSchema
