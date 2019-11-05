'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User        = use('App/Models/User');
const ProfStudent = use('App/Models/ProfessorsStudent');
const { validate }  = use('Validator');
//Functions Helpers
const {
  conv
} = use('App/Helpers');
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
    let studant;
    if (professor_id == 'null' || professor_id == null) {
      studant = await ProfStudent.findBy('studant_id', studant_id);
      if (studant == null) {
        return response.status(200).json([]);
      }

      const professor_id = JSON.parse(JSON.stringify(studant)).professor_id;
      const professor = await User.findBy('id', professor_id);
      await professor.load('academic');
      return response.status(200).json({...JSON.parse(JSON.stringify(professor)), error:false});
      
    }else{
      //Procurar os alunos desse professor. Melhor algoritmo para isso
      let professor = await ProfStudent.query().where('professor_id', professor_id).andWhere('status', 1).fetch();
      professor =  JSON.parse(JSON.stringify(professor));
      if (professor.length == 0) {
        return response.status(200).json([]);
      }

      let studant_id = []
      for (let i = 0; i < professor.length; i++) {
        studant_id.push(professor[i].studant_id);
      }

      studant_id = studant_id.join(',');

      studant = await User.query().whereRaw(`id IN (${studant_id})`).fetch();
      return studant;
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
  async store ({ request, response, auth }) {
    const {email=null} = request.all();
    
    //Aluno existe
    let profStudent = await User.findBy('email', email);
        profStudent = await ProfStudent.query().where('studant_id', profStudent.id).andWhere('status', 0).fetch();
    console.log(profStudent)
        if (profStudent == null) {
      return response.status(200).json({message:"Vínculo insponível", error: true});
    }

    profStudent = conv(profStudent);

    
    return profStudent;

    //Check se mais tem ate 20 alunos


    return auth.user;
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
