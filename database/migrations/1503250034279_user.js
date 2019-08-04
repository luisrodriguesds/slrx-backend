'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments()
      //table.string('username', 80).notNullable().unique()
      table.string('name', 254).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 60).notNullable()
      table.string('access_level', 254).notNullable()
      table.string('access_level_slug', 254).notNullable()
      table.string('cpf', 254).notNullable().unique()
      table.datetime('birthday').notNullable()
      table.integer('sex', 11).notNullable().defaultTo(1)
      table.string('other_email', 254)
      table.string('state', 254).notNullable()
      table.string('city', 254).notNullable()
      table.string('phone1', 254).notNullable()
      table.string('phone2', 254)
      table.integer('confirm', 11).notNullable().defaultTo(0)
      table.integer('confirm_email', 11).notNullable().defaultTo(0)
      table.integer('limit', 11).notNullable().defaultTo(20)
      table.integer('drx_permission', 11).notNullable().defaultTo(1)
      table.integer('frx_permission', 11).notNullable().defaultTo(0)
      table.integer('status', 11).notNullable().defaultTo(1)

      table.timestamps()
    })
  }

  down () {
    this.drop('users')
  }
}

// cpf
// nome
// email
// senha
// estado
// cidade
// departamento
// laboratorio
// area_de_pesquisa
// telefone
// email_alternativo
// nivel_acesso
// permissao_drx
// permissao_frx
// uid
// confirmado
// email_confirmado
// titulo
// genero
// limite
// ies
// saudacao

module.exports = UserSchema
