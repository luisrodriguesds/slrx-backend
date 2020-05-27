'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ProfessorsStudent extends Model {
  static boot () {
    super.boot()

    this.addHook('afterCreate', 'ProfStudantHook.sendEmail')
  }

  professor (){
    return this.belongsTo('App/Models/User', 'professor_id')
  }

  student (){
    return this.belongsTo('App/Models/User', 'studant_id')
  }
}

module.exports = ProfessorsStudent
