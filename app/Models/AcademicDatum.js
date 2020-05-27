'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const ProfStudent = use('App/Models/ProfessorsStudent')
const Model = use('Model')
class AcademicDatum extends Model {
	static boot () {
    super.boot()    
    this.addHook('afterCreate', 'AcademicHook.sendEmail')
	}
	
	static get computed () {
		return ['email_leader', 'name_leader']
 	}

	async getEmailLeader ({user_id}) {
		const prof = await ProfStudent.findBy('studant_id', user_id)
		if (prof == null) {
			return ''
		}
		const email = await prof.professor().fetch()
		return email == null ? '' : email.email
	}
	 
	async getNameLeader({user_id}){
		const prof = await ProfStudent.findBy('studant_id', user_id)
		if (prof == null) {
			return ''
		}
		const name = await prof.professor().fetch()
		return name == null ? '' : name.name
	}

	user(){
		return this.belongsTo('App/Models/User');
	}
}

module.exports = AcademicDatum
