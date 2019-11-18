'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model      = use('Model')
const dateformat = use('dateformat');
const Env        = use('Env');

class Solicitation extends Model {
	//Gettings and Settings
	//  getCreatedAt(created_at){
	//    return dateformat(created_at, "dd/mm/yyyy HH:MM:ss");
	//  }

     getSettings(settings){
       return JSON.parse(settings);
     }

     getDownload(download){
        return `${Env.get('APP_URL_PROD')}/api/results/${download}`;
     }

    //Relacoes
    equipment(){
        return this.belongsTo('App/Models/Equipment');
    }

    gap(){
        return this.belongsTo('App/Models/Gap');
    }

    user(){
        return this.belongsTo('App/Models/User');
    }

}

module.exports = Solicitation
