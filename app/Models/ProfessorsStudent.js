'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ProfessorsStudent extends Model {
  static boot () {
    super.boot()

    this.addHook('afterCreate', 'ProfStudantHook.sendEmail')
  }
}

module.exports = ProfessorsStudent
