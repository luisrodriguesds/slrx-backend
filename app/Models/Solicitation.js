'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const dateformat = use('dateformat');

class Solicitation extends Model {
	//Gettings and Settings
	 getCreated_at(created_at){
	   return dateformat(created_at, "dd/mm/yyyy");
	 }

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
