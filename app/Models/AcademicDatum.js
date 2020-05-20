'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class AcademicDatum extends Model {
	static boot () {
    super.boot()    
    this.addHook('afterCreate', 'AcademicHook.sendEmail')
  }

	user(){
		return this.belongsTo('App/Models/User');
	}
}

module.exports = AcademicDatum
