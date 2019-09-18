'use strict'
const Solicitation  = use('App/Models/Solicitation');
const User          = use('App/Models/User');
const ProfStudent 	= use('App/Models/ProfessorsStudent');
const Database      = use('Database');
const dateformat    = use('dateformat');
const { validate }  = use('Validator');

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

// Cara tipo de usuário tem uma tratamento própio de críticas, então se usa switch
// switch (auth.user.access_level_slug) {
//   case 'administrador':
//   case 'operador':

//   break;
//   case 'professor':
      
//   break;
//   case 'tecnico':
//   case 'financeiro':
//       //do it
//   break;
//   default:
//   break;
// }


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
      shape:'required|in:Pó,Filme,Pastilha,Eletródo,Outro',
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
      }else if (auth.user.drx_permission == 0) {
        return response.status(200).json({message:"Você não tem permissão para cadastrar amostra de análise DRX", error:true});
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
      }else if (auth.user.frx_permission == 0) {
        return response.status(200).json({message:"Você não tem permissão para cadastrar amostra de análise FRX", error:true});
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

 
  /*
   * Update solicitation details.
   * PUT or PATCH solicitations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({request, response, auth }) {
    //DRX - {"tecnica":"drx","dois_theta_inicial":10,"dois_theta_final":100,"delta_dois_theta":0.013}
    //FRX - {"tecnica":"frx","resultado":"oxidos||elementos","medida":"semi-quantitativa"}
    const data = request.only(['equipment_id', 'gap_id', 'method', 'composition', 'shape', 'flammable', 'radioactive', 'toxic', 'corrosive', 'hygroscopic', 'note']);
    const message_success = "Amostra alterada com successo!", message_faul = "Usuário não tem permissão para realizar estas alterações!";
    let {settings, id, user_id} = request.all();
    
    //Validation
    //Rules
    let rules = {
      equipment_id: 'required',
      gap_id: 'required',
      method:'required|in:DRX,FRX',
      composition:'required',
      shape:'required|in:Pó,Filme,Pastilha,Eletródo,Outro',
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
  
    switch (auth.user.access_level_slug) {
      case 'administrador':
      case 'operador':
          await Solicitation.query().where('id', id).update(data);
          return response.status(200).json({message, error:false});
      break;
      case 'professor':
          //Fazer as críticas para update
          if (auth.user.id == user_id) {
              await Solicitation.query().where('id', id).update(data);
              return response.status(200).json({message:message_success, error:false});
          }

          let hasStudant = await ProfStudent.query().where({professor_id:auth.user.id, studant_id:user_id}).fetch();
          if (hasStudant.length == 0) {
              await Solicitation.query().where('id', id).update(data);  
              return response.status(406).json({message:message_faul, error:true});      
          }

          hasStudant = JSON.parse(JSON.stringify(hasStudant));
          if (hasStudant[0].studant_id == user_id) {
              await Solicitation.query().where('id', id).update(data);  
              return response.status(200).json({message:message_success, error:false});
          }
      break;
      case 'tecnico':
      case 'financeiro':
          //do it
      break;
      default:
          if (auth.user.id == user_id) {
            await Solicitation.query().where('id', id).update(data);
            return response.status(200).json({message:message_success, error:false});
          }else{
            return response.status(406).json({message:message_faul, error:true});      
          }
      break;
    }
    
    return response.status(200).json({message:message_success error:false});
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
  async show ({ params, response, auth }) {
    let res = [];
    res = await Solicitation.query().where({name:params.name}).with('equipment').with('gap').with('user').fetch();      
    res = JSON.parse(JSON.stringify(res));
    if (res.length == 0) {
      return response.status(406).json([]);
    }

    switch (auth.user.access_level_slug) {
      case 'administrador':
      case 'operador':
          return res;
      break;
      case 'professor':
          if (res[0].user_id == auth.user.id) {
            return res;
          }
    
          let hasStudant = await ProfStudent.query().where({professor_id:auth.user.id, studant_id:res[0].user_id}).fetch();
          if (hasStudant.length == 0) {
              return response.status(406).json([]);
          }
    
          hasStudant = JSON.parse(JSON.stringify(hasStudant));
          // console.log(hasStudant);
          if (hasStudant[0].studant_id != res[0].user_id) {
            return response.status(406).json([]);        
          }
          return res;
      break;
      case 'tecnico':
      case 'financeiro':
          //do it
          return res;
      break;
      default:
        res = await Solicitation.query().where({name:params.name, user_id:auth.user.id}).with('equipment').with('gap').with('user').fetch();
        return res;
      break;
    }
  }

  async all ({request, auth}) {
    const {page=1, perPage=10} = request.all();
    let solicitations = [];
    switch (auth.user.access_level_slug) {
        case 'administrador':
        case 'operador':
          solicitations = await Solicitation.query().with('equipment').orderByRaw('created_at DESC, name ASC').limit(100).paginate(page, perPage);
        break;
        case 'professor':
            //Professor deve aparecer as solicitações dele e de seus alunos
            //Este professor tém algum aluno cadastrado?
            //Sim
            const hasStudant = await ProfStudent.findBy({professor_id:auth.user.id});
            if (hasStudant == null) {
              solicitations = await Solicitation.query().where({user_id:auth.user.id}).with('equipment').orderByRaw('created_at DESC, name ASC').limit(50).paginate(page, perPage);
            }else{
              //Não
              //Este aluno tem amostra cadastradas?
              //Sim
              //SELECT u.id, u.name, u.access_level, ps.professor_id, ps.studant_id, s.* FROM users as u, professors_students as ps, solicitations as s WHERE ps.professor_id = '2' AND studant_id = u.id AND s.user_id IN (u.id, '2');
              solicitations = await Database.table({
                u:'users',
                ps:'professors_students',
                s:'solicitations',
                e:'equipment'
              }).select({
                user_id:'u.id',
                id:'s.id',
                user_id:'s.user_id',
                equipment_id:'s.equipment_id',
                equipment:'e.id',
                equipment_name:'e.name',
                gap_id:'s.gap_id',
                name:'s.name',
                method:'s.method',
                settings:'s.settings',
                status:'s.status',
                composition:'s.composition',
                shape:'s.shape',
                flammable:'s.flammable',
                radioactive:'s.radioactive',
                toxic:'s.toxic',
                corrosive:'s.corrosive',
                hygroscopic:'s.hygroscopic',
                note:'s.note',
                received_date:'s.received_date',
                solicitation_date:'s.solicitation_date',
                conclusion_date:'s.conclusion_date',
                analyze_time:'s.analyze_time',
                created_at:'s.created_at',
                updated_at:'s.updated_at',
              }).whereRaw(`ps.professor_id = '${auth.user.id}' AND studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}') AND s.equipment_id = e.id`).orderByRaw('s.created_at DESC, s.name ASC').paginate(page, perPage);
              for (let i = 0; i < solicitations.data.length; i++) {
                solicitations.data[i].equipment = {name:solicitations.data[i].equipment_name};       
              }
            }
        break;
        case 'tecnico':
        case 'financeiro':
            //do it
        break;
        default:
          solicitations = await Solicitation.query().where({user_id:auth.user.id}).with('equipment').orderByRaw('created_at DESC, name ASC').limit(50).paginate(page, perPage);
        break;
    }
    
    return solicitations;
  }

  async filter ({ request, auth }) {
    const {filter=null, page=1, perPage=10} = request.all();
    let res = [];

    switch (auth.user.access_level_slug) {
      case 'administrador':
      case 'operador':
          res = await Solicitation.query().where('name', 'like', `%${filter}%`).with('equipment').orderByRaw('created_at DESC, name ASC').limit(50).paginate(page, perPage);
      break;
      case 'professor':
          const hasStudant = await ProfStudent.findBy({professor_id:auth.user.id});
          if (hasStudant == null) {
            res = await Solicitation.query().where('name', 'like', `%${filter}%`).andWhere({user_id:auth.user.id}).with('equipment').orderByRaw('created_at DESC, name ASC').limit(50).paginate(page, perPage);
          }else{
            //SELECT u.id, u.name, u.access_level, ps.professor_id, ps.studant_id, s.* FROM users as u, professors_students as ps, solicitations as s WHERE ps.professor_id = '2' AND studant_id = u.id AND s.user_id IN (u.id, '2');
            res = await Database.table({
              u:'users',
              ps:'professors_students',
              s:'solicitations',
              e:'equipment'
            }).select({
              user_id:'u.id',
              id:'s.id',
              user_id:'s.user_id',
              equipment_id:'s.equipment_id',
              equipment:'e.id',
              equipment_name:'e.name',
              gap_id:'s.gap_id',
              name:'s.name',
              method:'s.method',
              settings:'s.settings',
              status:'s.status',
              composition:'s.composition',
              shape:'s.shape',
              flammable:'s.flammable',
              radioactive:'s.radioactive',
              toxic:'s.toxic',
              corrosive:'s.corrosive',
              hygroscopic:'s.hygroscopic',
              note:'s.note',
              received_date:'s.received_date',
              solicitation_date:'s.solicitation_date',
              conclusion_date:'s.conclusion_date',
              analyze_time:'s.analyze_time',
              created_at:'s.created_at',
              updated_at:'s.updated_at',
            }).whereRaw(`ps.professor_id = '${auth.user.id}' AND studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}') AND s.equipment_id = e.id AND s.name LIKE '%${filter}%'`).orderByRaw('s.created_at DESC, s.name ASC').paginate(page, perPage);
            for (let i = 0; i < res.data.length; i++) {
              res.data[i].equipment = {name:res.data[i].equipment_name};        
              res.data[i].settings = JSON.parse(res.data[i].settings); ;        
            }
          }
      break;
      case 'tecnico':
      case 'financeiro':
          //do it
      break;
      default:
          res = await Solicitation.query().where('name', 'like', `%${filter}%`).andWhere({user_id:auth.user.id}).with('equipment').orderBy('created_at', 'desc').limit(50).paginate(page, perPage);
      break;
    }

    return res;
  }


  /**
   * Delete a solicitation with id.
   * DELETE solicitations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, response, auth }) {
    const {name} = params;
    let solicitation = await Solicitation.findBy('name', name);
    if (solicitation == null) {
      return response.status(200).json({message:"Solicitação não encontrada.", error:true});
    }
    solicitation = JSON.parse(JSON.stringify(solicitation));
    
    switch (auth.user.access_level_slug) {
      case 'administrador':
      case 'operador':
          await Solicitation.query().where('name', name).update({status:-2});
          solicitation.status = -2;
      break;
      case 'professor':
          //Verificar se a amostra é de um dos seus alunos para cancelar
          // let user = await User.query().where('id', auth.user.id).with('').fetch();
          await Solicitation.query().where('id', id).update({status:-1});
          solicitation.status = -1;
      break;
      case 'tecnico':
      case 'financeiro':
          //do it
      break;
      default:
          if (auth.user.id == solicitation.user_id) {
            await Solicitation.query().where('name', name).update({status:-1});
            solicitation.status = -1;
          }
      break;
    }

    return response.status(200).json({message:"Amostra canceladas com successo!", error:false, solicitation});
  }
  
  async destroy_all ({request, response, auth }) {
    const {array} = request.all();
    async function getSol(){
      const res = array.map(async id => {
        try {
          let solicitation = await Solicitation.findBy('id', id);
          if (solicitation != null) {
            solicitation = JSON.parse(JSON.stringify(solicitation));

            switch (auth.user.access_level_slug) {
              case 'administrador':
              case 'operador':
                  await Solicitation.query().where('id', id).update({status:-2});
                  solicitation.status = -2;
              break;
              case 'professor':
                //Fazer as críticas 
                  await Solicitation.query().where('id', id).update({status:-1});
                  solicitation.status = -1;
              break;
              case 'tecnico':
              case 'financeiro':
                //Fazer as críticas   

              break;
              default:
                  if (auth.user.id == solicitation.user_id) {
                    await Solicitation.query().where('id', id).update({status:-1});
                    solicitation.status = -1;
                  }
              break;
            }

            return solicitation;
          }
        } catch (error) {
          //Mandar um alerta pra mim
        }

      });
      const sol = await Promise.all(res);
      return sol;
    }
    const getSolic = await getSol();
    return response.status(200).json({message:"Amostras canceladas com successo!", error:false});
  }

}

module.exports = SolicitationController
