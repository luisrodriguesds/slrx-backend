'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DocumentsSchema extends Schema {
  up () {
    this.create('documents', (table) => {
      table.increments()
      table
          .integer('user_id', 11)
          .unsigned()
          .references('id')
          .inTable('users')
          .onUpdate('CASCADE')
          .onDelete('CASCADE')
      table.text('url')
      table.string('type')
      table.integer('status', 11).notNullable().defaultTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('documents')
  }
}

module.exports = DocumentsSchema
