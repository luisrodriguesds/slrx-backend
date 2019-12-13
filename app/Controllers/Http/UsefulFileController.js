'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Files         = use('App/Models/UsefulFile')
const { validate }  = use('Validator');
const Helpers       = use('Helpers')
/**
 * Resourceful controller for interacting with usefulfiles
 */
class UsefulFileController {
  /**
   * Show a list of all usefulfiles.
   * GET usefulfiles
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const {page=1, perPage=10} = request.all();
    const file = await Files.query().paginate(page, perPage);
    return file;
  }

  /**
   * Create/save a new usefulfile.
   * POST usefulfiles
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const data = request.only(['name', 'description']);
    //Validation
    //Rules
    let rules = {
      // validation rules
      name:'required|min:3',
      description:'required|min:3',
    }

    //Validation
    let validation = await validate(data, rules, {
      'name.required':'Campo nome está vazio',
      'name.min':'Campo nome com menos que 3 caracteres',
      'description.required':'Campo descrição está vazio',
      'description.min':'Campo descrição com menos que 3 caracteres',
    });
    if (validation.fails()) {
      return response.status(200).json({...validation.messages()[0], error:true});
    }

    //Arquivo

    //Receber o arquivo e colocar na pasta tmp  
    let file = request.file('file', {
      extnames: ['dat', 'json', 'png', 'jpg', 'jpeg', 'raw', 'txt', 'xrdml', 'zip', 'rar'],
      size: '5mb'
    });
    // console.log(sample);
    if (file === null) {
      return response.status(200).json({message:"Campo arquivo está vazio.", error:true});
    }

    let name = `${Date.now().toString()}_${file.clientName}`;
    await file.move(Helpers.tmpPath('usefulfiles'), {
      name,
      overwrite: true
    });
  
    if (!file.moved()) {
      return response.status(200).json({message:file.error().message, error:true});
    }

    await Files.create({...data, link:name});

    return response.status(200).json({message:"Arquivo enviado com sucesso!", error:false});

  }

  async download({params, response}){
    const {name} = params;
    return response.download(Helpers.tmpPath(`usefulfiles/${name}`));
  }

  /**
   * Display a single usefulfile.
   * GET usefulfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
  }

  /**
   * Update usefulfile details.
   * PUT or PATCH usefulfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const {id} = params;
    const data = request.only(['name', 'description']);
    //Validation
    //Rules
    let rules = {
      // validation rules
      name:'required|min:3',
      description:'required|min:3',
    }

    //Validation
    let validation = await validate(data, rules, {
      'name.required':'Campo nome está vazio',
      'name.min':'Campo nome com menos que 3 caracteres',
      'description.required':'Campo descrição está vazio',
      'description.min':'Campo descrição com menos que 3 caracteres',
    });
    if (validation.fails()) {
      return response.status(200).json({...validation.messages()[0], error:true});
    }

    //Arquivo

    //Receber o arquivo e colocar na pasta tmp  
    let file = request.file('file', {
      extnames: ['dat', 'json', 'png', 'jpg', 'jpeg', 'raw', 'txt', 'xrdml', 'zip', 'rar'],
      size: '5mb'
    });
    // console.log(sample);
    if (file != null) {
      let name = `${Date.now().toString()}_${file.clientName}`;
      await file.move(Helpers.tmpPath('usefulfiles'), {
        name,
        overwrite: true
      });
    
      if (!file.moved()) {
        return response.status(200).json({message:file.error().message, error:true});
      }
      await Files.query().where('id', id).update({...data, link:name});
  
      return response.status(200).json({message:"Arquivo editado com sucesso!", error:false});
    }

    await Files.query().where('id', id).update({...data});
  
    return response.status(200).json({message:"Arquivo editado com sucesso!", error:false});
  }

  /**
   * Delete a usefulfile with id.
   * DELETE usefulfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response, auth }) {
    const {id} = params;
    if (id == null) {
      return response.status(200).json({message:"Id nulo", error:true});   
    }

    if (auth.user.access_level_slug != 'administrador') {
      return response.status(200).json({message:"Usuário não autorizado", error:true});   
    }

    await Files.query().where('id', id).delete();
    return response.status(200).json({message:"Arquivo apagado com sucesso", error:false});   

  }
}

module.exports = UsefulFileController
