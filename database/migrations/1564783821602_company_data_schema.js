'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CompanyDataSchema extends Schema {
  up () {
    this.create('company_data', (table) => {
      table.increments()
      table.string('cnpj', 254).notNullable().unique()
      table.string('fantasy_name', 254).notNullable()
      table.string('company_name', 254).notNullable()
      table.string('state_registration', 254).notNullable()
      table.string('email_company', 254).notNullable()
      table.string('fone', 254).notNullable()
      table.string('cep', 254).notNullable()
      table.string('street', 254).notNullable()
      table.string('neighborhood', 254).notNullable()
      table.string('number', 254).notNullable()
      table.string('city', 254).notNullable()
      table.string('state', 254).notNullable()
      table.integer('status', 11).notNullable().defaultTo(1)

      table.timestamps()
    })
  }

  down () {
    this.drop('company_data')
  }
}

module.exports = CompanyDataSchema
