'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RequestPass extends Model {
  static boot () {
    super.boot()    
    this.addHook('afterCreate', 'RequestPassHook.sendEmail')
  }
}

module.exports = RequestPass
