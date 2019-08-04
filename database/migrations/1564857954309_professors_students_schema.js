'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProfessorsStudentsSchema extends Schema {
  up () {
    this.create('professors_students', (table) => {
      table.increments()
      table
        .integer('professor_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')

      table
        .integer('studant_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.integer('status', 11).notNullable().defaultTo(1)
        
      table.timestamps()
    })
  }

  down () {
    this.drop('professors_students')
  }
}

module.exports = ProfessorsStudentsSchema
