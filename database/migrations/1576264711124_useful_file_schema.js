'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UsefulFileSchema extends Schema {
  up () {
    this.create('useful_files', (table) => {
      table.increments()
      table.string('name', 240)
      table.text('description')
      table.string('link', 240)
      table.integer('status', 11).notNullable().defaultTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('useful_files')
  }
}

module.exports = UsefulFileSchema
