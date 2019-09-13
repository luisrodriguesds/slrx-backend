'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Solicitation extends Model {
    //Relacoes
    equipment(){
        return this.belongsTo('App/Models/Equipment');
    }

    //Relacoes
    gap(){
        return this.belongsTo('App/Models/Gap');
    }

}

module.exports = Solicitation
