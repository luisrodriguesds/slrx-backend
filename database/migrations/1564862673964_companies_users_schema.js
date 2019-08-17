'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CompaniesUsersSchema extends Schema {
  up () {
    this.create('companies_users', (table) => {
      table.increments()
      
      table
        .integer('company_datum_id')
        .unsigned()
        .references('id')
        .inTable('company_data')
        .onUpdate('CASCADE')

      table
        .integer('user_id')
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
    this.drop('companies_users')
  }
}

module.exports = CompaniesUsersSchema
