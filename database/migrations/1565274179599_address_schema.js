'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddressSchema extends Schema {
  up () {
    this.create('addresses', (table) => {
      table.increments()
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        
      table.string('cep_address', 254).notNullable()
      table.string('street_address', 254).notNullable()
      table.string('neighborhood_address', 254).notNullable()
      table.string('number_address', 254).notNullable()
      table.string('city_address', 254).notNullable()
      table.string('state_address', 254).notNullable()
      table.integer('status', 11).notNullable().defaultTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('addresses')
  }
}

module.exports = AddressSchema