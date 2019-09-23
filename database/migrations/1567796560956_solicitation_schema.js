'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SolicitationSchema extends Schema {
  up () {
    this.create('solicitations', (table) => {
      table.increments()
      table
          .integer('user_id', 11)
          .unsigned()
          .references('id')
          .inTable('users')
          .onUpdate('CASCADE')
          .onDelete('CASCADE')
      
      table
          .integer('equipment_id', 11)
          .unsigned()
          .references('id')
          .inTable('equipment')
          .onUpdate('CASCADE')
          .onDelete('CASCADE')
        
      table
          .integer('gap_id', 11)
          .unsigned()
          .references('id')
          .inTable('gaps')
          .onUpdate('CASCADE')
          .onDelete('CASCADE')

      table.string('name', 254).notNullable()
      table.string('method', 254).notNullable() //FRX OU DRX
      
      /*FRX: {resultado:;medida:} DRX: {tipo_analise:;condicao:;velocidade:;fixed_time:;2theta_inicial:;2theta_final:;delta_2theta:}*/
      table.json('settings', 254).notNullable() // knex.table('users').where({id: 1}).update({json_data: JSON.stringify(mightBeAnArray)});

      /*1 - Aguardando autorização do professor
        2 - Aguardando aprovação do laboratório
        3 - Aguardando confirmação de entrega da amostra
        4 - Na fila do equipamento
        5 - Em processo de análise
        6 - Análise Concluída. Aguardando recuperação da amostra.
        7 - Solicitação finalizada.

        -1 - Cancelada pelo responsável.
        -2 - Cancelada pelo operador.
        -3 - Cancelada por falta de entrega da amostra.  */
      table.integer('status', 11).notNullable().defaultTo(1)

      table.string('composition', 254)
      table.string('shape', 254) // 1 - Pó  2 - Filmes 3 - Pastilhas 4 - Eletrodo 5 - Outro
      table.string('flammable', 254) // 0-não 1-sim
      table.string('radioactive', 254) // 0-não 1-sim
      table.string('toxic', 254) // 0-não 1-sim
      table.string('corrosive', 254) // 0-não 1-sim
      table.string('hygroscopic', 254) // 0-não 1-sim

      table.text('note') // observações gerais

      table.datetime('received_date')
      table.datetime('solicitation_date')
      table.datetime('conclusion_date')
      table.time('analyze_time')
      table.string('download', 254)
      
      table.timestamps()
    })
  }

  down () {
    this.drop('solicitations')
  }
}

module.exports = SolicitationSchema
