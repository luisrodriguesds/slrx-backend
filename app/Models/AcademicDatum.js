'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class AcademicDatum extends Model {
	user(){
		return this.belongsTo('App/Models/Users');
	}
}

module.exports = AcademicDatum
