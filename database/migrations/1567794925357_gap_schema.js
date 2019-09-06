'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class GapSchema extends Schema {
  up () {
    this.create('gaps', (table) => {
      table.increments()
      table.string('name', 254).notNullable()
      table.integer('status', 11).notNullable().defaultTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('gaps')
  }
}

module.exports = GapSchema
