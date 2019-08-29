'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User        = use('App/Models/User');
const ProfStudent = use('App/Models/ProfessorsStudent');

/**
 * Resourceful controller for interacting with professorsstudents
 */
class ProfessorsStudentController {
  /**
   * Show a list of all professorsstudents.
   * GET professorsstudents
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {

  }

  async show({request, response, auth}){
    const {studant_id=null, professor_id=null} = request.all();
    if (professor_id == null) {
      const studant = await ProfStudent.findBy('studant_id', studant_id);
      if (studant == null) {
        return response.status(200).json({messaage:"Nenhum vínculo encontrado", error:true});
      }

      const professor_id = JSON.parse(JSON.stringify(studant)).professor_id;
      const professor = await User.findBy('id', professor_id);
      return response.status(200).json({...JSON.parse(JSON.stringify(professor)), error:false});
      console.log(professor_id);
    }
    return 0;
  }

  /**
   * Create/save a new professorsstudent.
   * POST professorsstudents
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }


  /**
   * Update professorsstudent details.
   * PUT or PATCH professorsstudents/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a professorsstudent with id.
   * DELETE professorsstudents/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = ProfessorsStudentController
