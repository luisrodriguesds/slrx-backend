'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CompaniesUser extends Model {
  static boot () {
    super.boot()    
    this.addHook('afterCreate', 'CompanyHook.sendEmail')
  }

  user () {
		return this.belongsTo('App/Models/User', 'user_id')
  }

  company () {
		return this.belongsTo('App/Models/CompanyDatum', 'company_datum_id')
  }

}

module.exports = CompaniesUser
