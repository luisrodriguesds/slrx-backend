'use strict'
const Env  = use('Env');


/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UsefulFile extends Model {
  //Gettings and Settings
  getLink(link){
    return `${Env.get('APP_URL_PROD')}/api/useful-files/donwload/${link}`;
  }
}

module.exports = UsefulFile
