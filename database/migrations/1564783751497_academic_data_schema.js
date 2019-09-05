'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AcademicDataSchema extends Schema {
  up () {
    this.create('academic_data', (table) => {
      table.increments()
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.string('ies', 254).notNullable()
      table.string('department', 254).notNullable()
      table.string('title', 254).notNullable()
      table.string('laboratory', 254).notNullable()
      table.string('research', 254).notNullable()
      table.text('description')
      table.integer('status', 11).notNullable().defaultTo(1)

      table.timestamps()
    })
  }

  down () {
    this.drop('academic_data')
  }
}

module.exports = AcademicDataSchema
