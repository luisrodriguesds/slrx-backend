'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EquipmentSchema extends Schema {
  up () {
    this.create('equipment', (table) => {
      table.increments()
      table.string('name', 254).notNullable()
      table.string('type', 254).notNullable()
      table.string('tube', 254).notNullable()
      table.string('image', 254)
      table.text('note')
      table.integer('status', 11).notNullable().defaultTo(1)
      table.timestamps()
    })
  }

  down () {
    this.drop('equipment')
  }
}

module.exports = EquipmentSchema
