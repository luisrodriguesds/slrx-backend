'use strict'
const Solicitation  = use('App/Models/Solicitation');
const Database      = use('Database');
const dateformat    = use('dateformat');
const { validate }  = use('Validator');

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with solicitations
 */
class SolicitationController {
  /**
   * Show a list of all solicitations.
   * GET solicitations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response }) {
  }


  /**
   * Create/save a new solicitation.
   * POST solicitations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   {
      "equipment_id":"",
      "gap_id":"",
      "name":"",
      "method":"",
      "settings":"",
      "status":"",
      "composition":"",
      "shape":"",
      "flammable":"",
      "radioactive":"",
      "toxic":"",
      "corrosive":"",
      "hygroscopic":"",
      "note":"",
      "received_date":"",
      "solicitation_date":"",
      "conclusion_date":"",
      "analyze_time":""
  }
   */

  async store ({ request, response, auth}) {
    //DRX - {"tecnica":"drx","dois_theta_inicial":10,"dois_theta_final":100,"delta_dois_theta":0.013}
    //FRX - {"tecnica":"frx","resultado":"oxidos||elementos","medida":"semi-quantitativa"}
    const data = request.only(['equipment_id', 'gap_id', 'method', 'composition', 'shape', 'flammable', 'radioactive', 'toxic', 'corrosive', 'hygroscopic', 'note']);
    let {settings, quantity=null} = request.all();
    const now = dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
    quantity = (quantity > 20) ? 20 : quantity; // previnir criar infinitas
    
    //Validation
    //Rules
    let rules = {
      equipment_id: 'required',
      gap_id: 'required',
      method:'required|in:DRX,FRX',
      composition:'required',
      shape:'required|in:Pó,Filme,Pastilha,Eletrodo,Outro',
      flammable:'required|in:Não,Sim',
      radioactive:'required|in:Não,Sim',
      toxic:'required|in:Não,Sim',
      corrosive:'required|in:Não,Sim',
      hygroscopic:'required|in:Não,Sim',
    }

    //Validation
    let validation = await validate(data, rules);
    if (validation.fails()) {
      return response.status(200).json({...validation.messages()[0], error:true});
    }

    if (data.method == 'DRX') {
      //Rules
      let rules = {
        tecnica: 'required|in:DRX',
        dois_theta_inicial: 'required',
        dois_theta_final:'required',
        delta_dois_theta:'required'
      }

      //Validation
      let validation = await validate(settings, rules);
      if (validation.fails()) {
        return response.status(200).json({...validation.messages()[0], error:true});
      }

    }else{
      //Rules
      let rules = {
        tecnica: 'required|in:FRX',
        resultado: 'required|in:oxidos,elementos',
        medida:'required|in:semi-quantitativa'
      }

      //Validation
      let validation = await validate(settings, rules);
      if (validation.fails()) {
        return response.status(200).json({...validation.messages()[0], error:true});
      }
    }

    //Gerar nome da amostra
    const pieces = auth.user.name.split(' ');
    let identify = '';
    for (let i = 0; i < pieces.length; i++) {
      identify+=pieces[i].charAt(0).toUpperCase();
    }
    identify = identify.slice(0, 3);

    let number = auth.user.id;
        number = ((number < 10) ? '00'+number : ((number >= 10 && number < 100) ? '0'+number : ''+number));
    identify+=number;
    identify+= ((data.method == 'DRX') ? 'D' : 'F');

    //Quantidade de amostras que devem ser cadastradas
    let array_sample = [];
    let start = await Solicitation.query().where({user_id:auth.user.id, method:data.method}).fetch();
        start = ((start == null) ? 1 : JSON.parse(JSON.stringify(start)).length+1);
 
    //Samples in array
    if (quantity !== 1) {
      for (var i = start; i < (parseInt(quantity)+start); i++) {
        let count = ((i < 10) ? '00'+(i) : ((i >= 10 && i < 100) ? '0'+(i) : ''+i));
        array_sample.push({name:identify+count, ...data, settings:JSON.stringify(settings), user_id:auth.user.id, created_at:now, updated_at:now});
      }
    }else{
      let count = ((start < 10) ? '00'+(start) : ((start >= 10 && start < 100) ? '0'+(start) : ''+start));
      array_sample.push({name:identify+count, ...data, settings:JSON.stringify(settings), user_id:auth.user.id,  created_at:now, updated_at:now});
    }

    //Check User - Perguntar ao sasaki as limitações de envio
    //Verificar qual o nível de acesso do usuário
    //Se aluno, verificar se ele pode enviar amostra frx e se está no limite de amostras
    //Se professor, verificar se ele pode enviar amsotra frx e se está no limite de amostras
    // switch(auth.user.access_level_slug){
    //   case "aluno":
    //     //Aluno só pode ter até 20 amostras entre os estágios 1 a 6.

    //     //O seu professor deve ter a permissão frx se for o caso

    //     //Informar ao seu professor

    //   break;
    //   case "professor":
    //     //Professor pode cadastrar quantas quiser?

    //     //Informar ao sasaki?,

    //   break;
    // }

    //Gravar no banco
    try{
      await Database.insert(array_sample).into('solicitations');
    }catch(error){
      return response.status(406).json({message:"Algo de errado aconteceu, tente novamente.", error:true});
    }
    const message = (array_sample.length == 1) ? `Foi criado o seguinte código ${array_sample[0].name}. Você deve gravá-lo na sua amostra.` : `Foram criados os códigos de ${array_sample[0].name} até ${array_sample[array_sample.length-1].name}. Você deve gravá-los nas suas amostras.`;
    return response.status(200).json({message:"Amostras cadastradas com sucesso! "+message, error:false});
  }

  

  /**
   * Display a single solicitation.
   * GET solicitations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response }) {
  }

  async own ({ params, request, auth, response }) {
    const {page=1, perPage=10} = request.all();
    const solicitations = await Solicitation.query().where({user_id:auth.user.id}).with('equipment').with('gap').paginate(page, perPage);
    return solicitations;
  }

  async filter ({ params, request, response }) {
  }

  /**
   * Update solicitation details.
   * PUT or PATCH solicitations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a solicitation with id.
   * DELETE solicitations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = SolicitationController
