'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AccessLevelSchema extends Schema {
  up () {
    this.create('access_levels', (table) => {
      table.increments()
      table.string('name', 254).notNullable()
      table.string('name_slug', 254).notNullable()
      table.integer('status', 11).notNullable().defaultTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('access_levels')
  }
}

module.exports = AccessLevelSchema
