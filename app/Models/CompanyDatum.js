'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CompanyDatum extends Model {

	// users(){
	// 	return this.belongsToMany('App/Models/User').pivotModel('App/Models/CompaniesUser')
	// }

	users(){
		return this.belongsToMany('App/Models/User').pivotTable('companies_users');
	}

	// solicitations(){
	// 	return this.manyThrough('App/Models/CompaniesUser', 'solicitations', 'user_id')
	// }
}

module.exports = CompanyDatum
