'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Equipment = use('App/Models/Equipment');
const { validate }  = use('Validator');

/**
 * Resourceful controller for interacting with equipment
 */
class EquipmentController {
  /**
   * Show a list of all equipment.
   * GET equipment
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const equipments = await Equipment.query().where('status', 1).fetch();
    return equipments;
  }

  async all ({ request, response, view }) {
    const equipments = await Equipment.query().fetch();
    return equipments;
  }

  /**
   * Render a form to be used for creating a new equipment.
   * GET equipment/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new equipment.
   * POST equipment
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const data = request.only(['name', 'type', 'tube', 'note', 'status'])
    console.log(data)
    //Validation
    //Rules
    let rules = {
      name: 'required',
      type: 'required|in:DRX,FRX',
      tube:'required|in:CO,CU,PD,RH',
      status:'required',
    }

    //Validation
    let validation = await validate(data, rules);
    if (validation.fails()) {
      return response.status(200).json({...validation.messages()[0], error:true});
    }
    try {
      await Equipment.create(data)
      return response.status(200).json({message:'Equipamento cadastrado com sucesso!', error:false});
    } catch (error) {
      return response.status(200).json({message:'Algo de errado aconteceu!', error:true});
    }
  }

  /**
   * Display a single equipment.
   * GET equipment/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
    const equipment = await Equipment.findBy('id',params.id)
    return equipment
  }


  /**
   * Update equipment details.
   * PUT or PATCH equipment/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const equipment = await Equipment.findBy('id',params.id)
    if (equipment == null) {
      return response.status(200).json({message:'Equipamento não encontrado.', error:true});
    }

    const data = request.only(['name', 'type', 'tube', 'note', 'status'])
    //Validation
    //Rules
    let rules = {
      name: 'required',
      type: 'required|in:DRX,FRX',
      tube:'required|in:CO,CU,PD,RH',
      status:'required',
    }

    //Validation
    let validation = await validate(data, rules);
    if (validation.fails()) {
      return response.status(200).json({...validation.messages()[0], error:true});
    }

    equipment.merge({...data})

    try {
      await equipment.save()
      return response.status(200).json({message:'Equipamento Alterado com sucesso!', error:false});
    } catch (error) {
      return response.status(200).json({message:'Algo de errado aconteceu!', error:true});
    }

    console.log(data)
  }

  /**
   * Delete a equipment with id.
   * DELETE equipment/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const equipment = await Equipment.findBy('id',params.id)
    if (equipment == null) {
      return response.status(200).json({message:'Equipamento não encontrado', error:true});
    }

    try {
      await equipment.delete()
      return response.status(200).json({message:'Equipamento deletado com sucesso', error:false});

    } catch (error) {
      return response.status(200).json({message:'Algo de errado aconteceu!', error:true});      
    }
  }
}

module.exports = EquipmentController
