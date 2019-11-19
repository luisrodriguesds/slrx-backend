'use strict'
const Solicitation  = use('App/Models/Solicitation');
const User          = use('App/Models/User');
const ProfStudent   = use('App/Models/ProfessorsStudent');
const Document 	    = use('App/Models/Document');
const Helpers       = use('Helpers');
const Hash          = use('Hash');
const Mail          = use('Mail');
const Database      = use('Database');
const dateformat    = use('dateformat');
const Env           = use('Env');
const { validate }  = use('Validator');

//Functions Helpers
const {
  formatMoney, 
  formatDate, 
  doc_number,
  date_diff,
  conv,
  getRandom
} = use('App/Helpers');

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
    quantity = (quantity == null) ? 1 : quantity;
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
    let start = await Solicitation.query().where({user_id:auth.user.id, method:data.method}).fetch();
    start = conv(start);
    start = ((start.length == 0) ? 1 : start.length+1);  
    
    //Samples in array
    let array_sample = [];
    let sample_name = [];
    for (var i = start; i < (parseInt(quantity)+start); i++) {
      let count = ((i < 10) ? '00'+(i) : ((i >= 10 && i < 100) ? '0'+(i) : ''+i));
      array_sample.push({name:identify+count, ...data, settings:JSON.stringify(settings), user_id:auth.user.id, created_at:now, updated_at:now});
      sample_name.push(identify+count);
    }

    //Check User - Perguntar ao sasaki as limitações de envio
    //Verificar qual o nível de acesso do usuário
    //Se aluno, verificar se ele pode enviar amostra frx e se está no limite de amostras
    //Se professor, verificar se ele pode enviar amsotra frx e se está no limite de amostras
    switch(auth.user.access_level_slug){
      case "aluno":
        //Aluno só pode ter até 20 amostras entre os estágios 1 a 6.

        //O seu professor deve ter a permissão frx se for o caso

        //Informar ao seu professor
        let prof = await Database.table({
                    u:'users',
                    ps:'professors_students'
                  }).select({
                    id:'u.id',
                    email:'u.email',
                    name:'u.name'
                  }).whereRaw(`ps.studant_id = '${auth.user.id}' AND u.id = ps.professor_id`);
        prof = conv(prof);

        let body = {prof:prof[0].name, studant:auth.user.name, samples:sample_name.join(), link:Env.get('APP_URL_PROD')};
        Mail.send('emails.newSolicitationByStudant', {body}, (message) => {
          message
              .to(prof[0].email)
              .from('<from-email>')
              .subject("SLRX - UFC | Liberação de Amostra para Aluno")
        });
      break;
    }

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
        tecnica: 'required|in:DRX,drx',
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
        tecnica: 'required|in:FRX,frx',
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
          await Solicitation.query().where('id', id).update({...data, settings:JSON.stringify(settings)});
          return response.status(200).json({message:message_success, error:false});
      break;
      case 'professor':
          //Amostra é sua?
          if (auth.user.id == user_id) {
              await Solicitation.query().where('id', id).update({...data, settings:JSON.stringify(settings)});
              return response.status(200).json({message:message_success, error:false});
          }

          //Você tem estudantes vinculados a você?
          let hasStudant = await ProfStudent.query().where({professor_id:auth.user.id, studant_id:user_id}).fetch();
              hasStudant = JSON.parse(JSON.stringify(hasStudant));                    
          if (hasStudant.length == 0) {
              return response.status(406).json({message:message_faul, error:true});      
          }

          //Este estudante é o dono da amostra?
          if (hasStudant[0].studant_id != user_id) {
            return response.status(406).json({message:message_faul, error:true});      
          }else{
            await Solicitation.query().where('id', id).update({...data, settings:JSON.stringify(settings)});  
            return response.status(200).json({message:message_success, error:false});
          }

      break;
      case 'tecnico':
      case 'financeiro':
          //do it later
          await Solicitation.query().where('id', id).update({...data, settings:JSON.stringify(settings)});
          return response.status(200).json({message:message_success, error:false});
      break;
      default:
          if (auth.user.id == user_id) {
            await Solicitation.query().where('id', id).update({...data, settings:JSON.stringify(settings)});
            return response.status(200).json({message:message_success, error:false});
          }else{
            return response.status(406).json({message:message_faul, error:true});      
          }
      break;
    }
    
    return response.status(200).json({message:message_success, error:false});
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
          if (hasStudant[0].studant_id != res[0].user_id) {
            return response.status(406).json([]);        
          }
          return res;
      break;
      case 'tecnico':
      case 'financeiro':
          //do it later
          return res;
      break;
      default:
        res = await Solicitation.query().where({name:params.name, user_id:auth.user.id}).with('equipment').with('gap').with('user').fetch();
        return res;
      break;
    }
  }

  async all ({request, auth}) {
    const {page=1, perPage=100} = request.all();
    let solicitations = [], count = 0;
    switch (auth.user.access_level_slug) {
        case 'administrador':
        case 'operador':
          solicitations = await Solicitation.query().with('equipment').with('user').orderByRaw('created_at DESC, name DESC').limit(100).paginate(page, perPage);
        break;
        case 'professor':
            //Professor deve aparecer as solicitações dele e de seus alunos
            //Este professor tém algum aluno cadastrado?
            //Sim
            const hasStudant = await ProfStudent.findBy({professor_id:auth.user.id});
            if (hasStudant == null) {
              solicitations = await Solicitation.query().where({user_id:auth.user.id}).with('equipment').orderByRaw('created_at DESC, name DESC').limit(50).paginate(page, perPage);
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
                id:'s.id',
                user_id:'s.user_id',
                user:'u.id',
                user_name:'u.name',
                equipment_id:'s.equipment_id',
                equipment:'e.id',
                equipment_name:'e.name',
                name:'s.name',
                method:'s.method',
                settings:'s.settings',
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
                status:'s.status',
                download:'s.download',
                created_at:'s.created_at',
                updated_at:'s.updated_at',
              }).whereRaw(`ps.professor_id = '${auth.user.id}' AND ps.studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}') AND s.equipment_id = e.id`)
              .groupBy('s.name')
              .having('s.name', '<=', 2)
              .orderByRaw('s.created_at DESC')
              .paginate(page, perPage);

              //Paginate não está retornando o total de resultados por algum motivo, tive que fazer na mão
              count = await Database.table({ u:'users', ps:'professors_students', s:'solicitations'}).select({user_id:'u.id',id:'s.id',}).whereRaw(`ps.professor_id = '${auth.user.id}' AND ps.studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}')`).groupBy('s.name').having('s.name', '<=', 2);
              count = count.length;
              solicitations.total = count;
              solicitations.lastPage = Math.round(count/solicitations.perPage);

              for (let i = 0; i < solicitations.data.length; i++) {
                solicitations.data[i].equipment = {name:solicitations.data[i].equipment_name};       
                solicitations.data[i].user = {name:solicitations.data[i].user_name, id:solicitations.data[i].user_id};       
              }
            }
        break;
        case 'tecnico':
        case 'financeiro':
            //do it
            await auth.user.load('company');
            const u = JSON.parse(JSON.stringify(auth.user));
            solicitations = await Database.table({
                u:'users',
                cu:'companies_users',
                s:'solicitations',
                e:'equipment'
              }).select({
                id:'s.id',
                user_id:'s.user_id',
                user:'u.id',
                user_name:'u.name',
                equipment_id:'s.equipment_id',
                equipment:'e.id',
                equipment_name:'e.name',
                name:'s.name',
                method:'s.method',
                settings:'s.settings',
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
                status:'s.status',
                download:'s.download',
                created_at:'s.created_at',
                updated_at:'s.updated_at',
              }).whereRaw(`cu.company_datum_id = '${u.company[0].id}' AND cu.user_id = u.id AND s.user_id = u.id AND s.equipment_id = e.id`)
              .orderByRaw('s.created_at DESC')
              .paginate(page, perPage);

              for (let i = 0; i < solicitations.data.length; i++) {
                solicitations.data[i].equipment = {name:solicitations.data[i].equipment_name};       
                solicitations.data[i].user = {name:solicitations.data[i].user_name, id:solicitations.data[i].user_id};                       
              }
        break;
        default:
          solicitations = await Solicitation.query().where({user_id:auth.user.id}).with('equipment').orderByRaw('created_at DESC, name DESC').limit(50).paginate(page, perPage);
        break;
    }
    
    return solicitations;
  }

  //Para exibir as amostras na página de perfil do usuário
  async filterByUser({request}){
    let {filter, user_id} = request.all();
    let solicitations;
    if (user_id.indexOf("company") == 0) {
        user_id = user_id.replace("company-","");
        let res = await Database.table({
              u:'users',
              cu:'companies_users',
              s:'solicitations',
              e:'equipment'
            }).select({
              user_id:'u.id',
              id:'s.id',
              user_id:'s.user_id',
              equipment_id:'s.equipment_id',
              equipment:'e.id',
              equipment_name:'e.name',
              name:'s.name',
              method:'s.method',
              status:'s.status',
              created_at:'s.created_at',
            }).whereRaw(`cu.company_datum_id = '${user_id}' AND cu.user_id = u.id AND s.user_id = u.id AND s.equipment_id = e.id AND s.name LIKE '%${filter}%'`)
            .orderByRaw('s.created_at DESC')
        return res;
    }else{
      solicitations = await Solicitation.query().where('name', 'LIKE', `%${filter}%`).andWhere('user_id', user_id).orderBy('created_at', 'desc').fetch();
      return solicitations;
    }
  }

  //Tipo de filtro para as amostras
  async filterby({request}){
		const {filter, page=1, perPage=50} = request.all();
    let solicitations;
    
    switch (filter) {
      case "Abertas":
        solicitations = await Solicitation.query().where('status', '!=', '7').with('equipment').with('user').orderBy('created_at', 'desc').paginate(page, perPage);
      break;
      case "DRX":
          solicitations = await Solicitation.query().where('method', '=', 'DRX').with('equipment').with('user').orderBy('created_at', 'desc').paginate(page, perPage);        
      break;
      case "FRX":
          solicitations = await Solicitation.query().where('method', '=', 'FRX').with('equipment').with('user').orderBy('created_at', 'desc').paginate(page, perPage);                
      break;
      case "Filtro":
          solicitations = await Solicitation.query().with('equipment').with('user').orderBy('created_at', 'desc').paginate(page, perPage);                
      break;
      default:
          solicitations = await Solicitation.query().where('status', '=', `${filter}`).with('equipment').with('user').orderBy('created_at', 'desc').paginate(page, perPage);                
      break;
    }
    return solicitations;
  }

  //Pesquisa dinamica
  async filter ({ request, auth }) {
    const {filter=null, page=1, perPage=100} = request.all();
    let res = [], count=0;

    switch (auth.user.access_level_slug) {
      case 'administrador':
      case 'operador':
          res = await Solicitation.query().where('name', 'like', `%${filter}%`).with('equipment').with('user').orderByRaw('created_at DESC').limit(100).paginate(page, perPage);
      break;
      case 'professor':
          const hasStudant = await ProfStudent.findBy({professor_id:auth.user.id});
          if (hasStudant == null) {
            res = await Solicitation.query().where('name', 'like', `%${filter}%`).andWhere({user_id:auth.user.id}).with('equipment').with('user').orderByRaw('created_at DESC').limit(100).paginate(page, perPage);
          }else{
            //SELECT u.id, u.name, u.access_level, ps.professor_id, ps.studant_id, s.* FROM users as u, professors_students as ps, solicitations as s WHERE ps.professor_id = '2' AND studant_id = u.id AND s.user_id IN (u.id, '2');
            res = await Database.table({
              u:'users',
              ps:'professors_students',
              s:'solicitations',
              e:'equipment'
            }).select({
              id:'s.id',
              user_id:'s.user_id',
              user:'u.id',
              user_name:'u.name',
              equipment_id:'s.equipment_id',
              equipment:'e.id',
              equipment_name:'e.name',
              name:'s.name',
              method:'s.method',
              settings:'s.settings',
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
              status:'s.status',
              download:'s.download',
              created_at:'s.created_at',
              updated_at:'s.updated_at',
            }).whereRaw(`ps.professor_id = '${auth.user.id}' AND ps.studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}') AND s.equipment_id = e.id AND s.name LIKE '%${filter}%'`)
            .groupBy('s.name')
            .having('s.name', '<=', 2)
            .orderByRaw('s.created_at DESC')
            .paginate(page, perPage);

            //Paginate não está retornando o total de resultados por algum motivo, tive que fazer na mão
            count = await Database.table({ u:'users', ps:'professors_students', s:'solicitations'}).select({user_id:'u.id',id:'s.id',}).whereRaw(`ps.professor_id = '${auth.user.id}' AND ps.studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}') AND s.name LIKE '%${filter}%'`).groupBy('s.name').having('s.name', '<=', 2);
            count = count.length;
            res.total = count;
            res.lastPage = Math.round(count/res.perPage);
            
            for (let i = 0; i < res.data.length; i++) {
              res.data[i].equipment = {name:res.data[i].equipment_name};  
              res.data[i].user = {name:res.data[i].user_name, id:res.data[i].user_id};                       
            }
          }
      break;
      case 'tecnico':
      case 'financeiro':
          //do it
          await auth.user.load('company');
          const u = JSON.parse(JSON.stringify(auth.user));
          res = await Database.table({
              u:'users',
              cu:'companies_users',
              s:'solicitations',
              e:'equipment'
            }).select({
              id:'s.id',
              user_id:'s.user_id',
              user:'u.id',
              user_name:'u.name',
              equipment_id:'s.equipment_id',
              equipment:'e.id',
              equipment_name:'e.name',
              name:'s.name',
              method:'s.method',
              settings:'s.settings',
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
              status:'s.status',
              download:'s.download',
              created_at:'s.created_at',
              updated_at:'s.updated_at',
            }).whereRaw(`cu.company_datum_id = '${u.company[0].id}' AND cu.user_id = u.id AND s.user_id = u.id AND s.equipment_id = e.id AND s.name LIKE '%${filter}%'`)
            .orderByRaw('s.created_at DESC')
            .paginate(page, perPage);

            for (let i = 0; i < res.data.length; i++) {
              res.data[i].equipment = {name:res.data[i].equipment_name};   
              res.data[i].user = {name:res.data[i].user_name, id:res.data[i].user_id};                       
            }
      break;
      default:
          res = await Solicitation.query().where('name', 'like', `%${filter}%`).andWhere({user_id:auth.user.id}).with('equipment').with('user').orderBy('created_at', 'desc').limit(50).paginate(page, perPage);
      break;
    }

    return res;
  }

  async results({params, response, auth}){
    const {name} = params;
    return response.download(Helpers.tmpPath(`results/${name}`));
  }

  async next_step ({ request, response, auth }) {
    const {id} = request.all();
    let check, message, body, title, to;
    let solicitation = await Solicitation.query().where('id', id).with('user').with('equipment').fetch();
        solicitation = conv(solicitation)[0];
    if (solicitation.length == 0) {
      return response.status(406).json({message:"Solicitação não encontrada", error:true});
    }

    switch (auth.user.access_level_slug) {
      case 'administrador':
      case 'operador':
        
        switch (solicitation.status) {
          case 1:
            // 1 -> 2: Somente autorização
            await Solicitation.query().where('id', id).update({status:(solicitation.status+1)});
            return response.status(200).json({message:"Amostra autorizada com sucesso!", error:false}); 
          break;
          case 2:
            // 2 -> 3: [SLRX] Análise da Amostra Nome Autorizada 
            message = "Amostra autorizada pelo laboratório com sucesso!";
            title   = `[SLRX] Análise da Amostra ${solicitation.name} Autorizada`;  
            to      = `emails.solicitationTwoToTree`;
          break;
          case 3:
            // 3 -> 4: [SLRX] Amostra  Nme Entregue ao Laboratório
            message = "Amostra entregue ao laboratório com sucesso!";
            title   = `[SLRX] Amostra  ${solicitation.name} Entregue ao Laboratório`;  
            to      = `emails.solicitationTreeToFour`;
            
            await Solicitation.query().where('id', id).update({received_date:`${dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss')}`});
        
          break;
          case 4:
            // 4 -> 5: [SLRX] Análise da Amostra Nome Em Processo de Análise
            message = "Amostra em processo de análise!";
            title   = `[SLRX] Análise da Amostra ${solicitation.name} Em Processo de Análise`;  
            to      = `emails.solicitationFourToFive`;
            
          break;
          case 5:
            // 5 -> 6: [SLRX] Análise da Amostra Nome Concluída
            message = "Arquivo enviado com sucesso!";
            title   = `[SLRX] Análise da Amostra ${solicitation.name} Concluída`;  
            to      = `emails.solicitationTwoToTree`;

            //Receber o arquivo e colocar na pasta tmp
           
              let sample = request.file('sample', {
                extnames: ['dat', 'json', 'png', 'jpg', 'jpeg', 'raw', 'txt', 'xrdml'],
                size: '2mb'
              });
              // console.log(sample);
              if (sample === null) {
                return response.status(200).json({message:"Arquivo da medida é necessário para avançar para o próximo passo.", error:true});
              }

              const {extname} = sample;
              let name = `${solicitation.name}_${Date.now().toString()}.${extname}`;
              await sample.move(Helpers.tmpPath('results'), {
                name,
                overwrite: true
              });
            
              if (!sample.moved()) {
                return response.status(200).json({message:sample.error().message, error:true});
              }

              await Solicitation.query().where('id', id).update({download:name});

          break;
          case 6:
             // 6 -> 7: [SLRX] Amostra Nome Finalizada!
            message = "Amostra consluída!";
            title   = `[SLRX] Amostra ${solicitation.name} Finalizada!`;  
            to      = `emails.solicitationSexToSeven`;
            
            await Solicitation.query().where('id', id).update({conclusion_date:`${dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss')}`});

          break;
          default:
            return response.status(200).json({message:"Amostra já concluída", error:true});
          break;
        }


        await Solicitation.query().where('id', id).update({status:(solicitation.status+1)});

        //Liberar email quando estiver em produção!
        body    = {name: solicitation.user.name, sample:solicitation.name, equipment:solicitation.equipment.name, link:Env.get('APP_URL_PROD')};
        Mail.send(to, {body}, (message) => {
          message
              .to(solicitation.user.email)
              .from('<from-email>')
              .subject(title)
        });

        return response.status(200).json({message, error:false}); 

      break;
      case 'professor':
        //Professor pode autorizar até 4 amostras, dele e de seus alunos.
        //A soma das amostras dele e de seus alunos que não estiverem no status 7 só pode ser menor ou igual a 4.
        //Para serem autorizado
          const hasStudant = await ProfStudent.findBy({professor_id:auth.user.id});
          if (hasStudant == null) {
            //Ver se a amostra é dele
            //Ver se essa amostra estar na fase 1
            if (solicitation.user_id != auth.user.id || solicitation.status != 1) {
              return response.status(200).json({message:"Você tem somente permissão de autorizar a amostra.", error:true});              
            }

            //Ver se ele pode passar essa amostra de 1 para 2
            check = await Solicitation.query().whereRaw(`user_id = ${auth.user.id} AND status > 1 AND status < 7`).fetch();
            check = JSON.parse(JSON.stringify(check));
            if (check.length >= 4) {
              return response.status(200).json({message:"Você excedeu o seu limite de 4 análises de amostras simultânea. Por favor check se não há amostras para serem retiradas do laboratório.", error:true});                            
            }

            //Emails para o sasaki ou para o LRX?
            
            //Emails para ele mesmo?

            await Solicitation.query().where('id', id).update({status:2});
            return response.status(200).json({message:"Amostra autorizada com sucesso!", error:false});                            
          }else{
            //Amostras do estudante
            //Verificar se amostra não está no passo diferente do 1
            if (solicitation.status != 1) {
              return response.status(200).json({message:"Você tem somente permissão de autorizar a amostra.", error:true});              
            }

            check = await Database.table({ u:'users', ps:'professors_students', s:'solicitations'}).select({id:'s.id',}).whereRaw(`ps.professor_id = '${auth.user.id}' AND ps.studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}') AND s.status > 1 AND s.status < 7 `).groupBy('s.name').having('s.name', '<=', 2);
            if (check.length >= 4) {
              return response.status(200).json({message:"Você excedeu o seu limite de 4 análises de amostras simultânea. Por favor check se não há amostras para serem retiradas do laboratório.", error:true});                            
            }

            await Solicitation.query().where('id', id).update({status:2});
            return response.status(200).json({message:"Amostra autorizada com sucesso!", error:false});
          }
      break;
      default:
        return response.status(406).json({message:"Usuário não autorizado", error:true});
      break;
    }
    return solicitation;
  }

  async next_step_all ({ params, request, response, auth }) {
    const {array} = request.all();
    let check, message, body, title;
    const sol = await Promise.all(array.map(async id => {
      try {
        let solicitation = await Solicitation.findBy('id', id);
            solicitation = JSON.parse(JSON.stringify(solicitation));
        if (solicitation != null && solicitation.status != 5 && solicitation.status != 7) {
            switch (auth.user.access_level_slug) {
              case 'administrador':
              case 'operador':

                switch (solicitation.status) {
                  case 1:
                    // 1 -> 2: Somente autorização
                    await Solicitation.query().where('id', id).update({status:(solicitation.status+1)});
                    // return response.status(200).json({message:"Amostra autorizada com sucesso!", error:false}); 
                  break;
                  case 2:
                    //As strings estão impedindo a continuação do código, pq?????????????
                    // 2 -> 3: [SLRX] Análise da Amostra Nome Autorizada 
                    // title   = '[SLRX] Análise da Amostra '+solicitation.name+' Autorizada';  
                    // body    = '<p>Olá '+solicitation.user.name+',<br> sua solicitação de análise da amostra <b> '+solicitation.name+'</b> foi';
                    // body    +='aprovada pelo responsável e pelo laboratório. Portanto, <strong>estamos aguardando o recebimento da amostra para iniciarmos a análise.</strong></p>';
                    // body    +='<p>O horário de recibemento e entrega de amostras do Laboratório de Raios X é de segunda a sexta nos seguintes horários: 08:30 às 11:30 e 14:00 às 17:00.</p>';
                    // body    +='<p>Lembre-se de etiquetar suas amostra usando o código de identificação da mesma.</p>';
                    // body    +='<p>Caso possua alguma dúvida, por favor entre em contato com o Laboratório ';
                    // body    +='por meio do endereço de email lrxufc@gmail.com, ou pelo telefone 85 33669013.</p>';
                    // body    +='<p style="text-align:right;">Atenciosamente,<br>Laboratório de Raios-X</p>';
                  break;
                  case 3:
                    // 3 -> 4: [SLRX] Amostra  Nme Entregue ao Laboratório
                    // title   = '[SLRX] Amostra  '+solicitation.name+' Entregue ao Laboratório';  
                    // body    = '<p>Olá '+solicitation.user.name+',<br> sua solicitação de análise da amostra <b> '+solicitation.name+'</b> foi';
                    // body   += 'recebida pelo laboratório. No momento ela permanecerá na fila do equipamento <b>'+solicitation.equipment.name+'</b> até que seja analizada.</p>';
                    // body   += '<p>Pedimos que aguarde até o processo ser concluído, quando você receberá um outro email notificando que a amostra entrou em processo de análise.</p>';
                    // body   += '<p>Caso possua alguma dúvida, por favor entre em contato com o Laboratório ';
                    // body   += 'por meio do endereço de email lrxufc@gmail.com, ou pelo telefone 85 33669013.</p>';
                    // body   += '<p style="text-align:right;">Atenciosamente,<br>Laboratório de Raios-X</p>';
             
                    await Solicitation.query().where('id', id).update({received_date:`${dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss')}`});
                  break;
                  case 4:
                    // 4 -> 5: [SLRX] Análise da Amostra Nome Em Processo de Análise
                    // title   = '[SLRX] Análise da Amostra '+solicitation.name+' Em Processo de Análise';  
                    // body    = '<p>Olá '+solicitation.user.name+',<br> sua solicitação de análise da amostra <b> '+solicitation.name+'</b> foi';
                    // body    += 'recebida pelo laboratório. No momento ela permanecerá na fila do equipamento <b>'+solicitation.equipment.name+'</b> entrou em processo de análise.</p>';
                    // body    += '<p>Em no máximo 24 horas, a análise estará pronta. Entretanto, a entrega do resultado será feita após o recolhimento da amostra.</p>';
                    // body    += '<p>Caso possua alguma dúvida, por favor entre em contato com o Laboratório ';
                    // body    += 'por meio do endereço de email lrxufc@gmail.com, ou pelo telefone 85 33669013.</p>';
                    // body    += '<p style="text-align:right;">Atenciosamente,<br>Laboratório de Raios-X</p>';
                  break;
                  case 6:
                     // 6 -> 7: [SLRX] Amostra Nome Finalizada!
                    // title   = '[SLRX] Amostra '+solicitation.name+' Finalizada!';  
                    // body    = '<p>Olá '+solicitation.user.name+',<br> sua solicitação de análise da amostra <b> ${solicitation.name}</b>  foi';
                    // body   += 'realizado com sucesso, então agradecemos sua cooperação! Com isso, seu resultado já está disponível em nosso site.</p>';
                    // body   += '<p>Para visualizá-lo acesse o <a href="'+Env.get('APP_URL_PROD')+'" target="_blank">Sistema de Solicitação de Análises de Raios-X</a>.<br>';
                    // body   += 'Vá na aba <b>Concluídas</b>, procure pela amostra com identificação <b>${solicitation.name}</b>. Ao clicar nela';
                    // body   += 'será exibida uma janela do lado direito contendo as informações da amostra. Nesta janela basta mover a barra para baixo, e então será possível';
                    // body   += 'visualizar um <b>botão de download</b>, que ao clicar, o download do resultado será efetuado!<br>';
                    // body   += 'O LRX agradece sua preferência pelos nosssos serviços! Estaremos sempre a disposição!</p>';
                    // body   += '<p>Caso possua alguma dúvida, por favor entre em contato com o Laboratório ';
                    // body   += 'por meio do endereço de email lrxufc@gmail.com, ou pelo telefone 85 33669013.</p>';
                    // body   += '<p style="text-align:right;">Atenciosamente,<br>Laboratório de Raios-X</p>';
                    
                    await Solicitation.query().where('id', id).update({conclusion_date:`${dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss')}`});
                  break;
                }

                await Solicitation.query().where('id', id).update({status:(solicitation.status+1)});

                //Liberar email quando estiver em produção!
                // Mail.send('emails.warningSample', {body}, (message) => {
                //   message
                //       .to(solicitation.user.email)
                //       .from('<from-email>')
                //       .subject(title)
                // });

                // return response.status(200).json({message, error:false}); 

              break;
              case 'professor':
                //Professor pode autorizar até 4 amostras, dele e de seus alunos.
                //A soma das amostras dele e de seus alunos que não estiverem no status 7 só pode ser menor ou igual a 4.
                //Para serem autorizado
                  const hasStudant = await ProfStudent.findBy({professor_id:auth.user.id});
                  if (hasStudant == null) {
                    //Ver se a amostra é dele
                    //Ver se essa amostra estar na fase 1
                    if (solicitation.user_id == auth.user.id || solicitation.status == 1) {
                      // return response.status(200).json({message:"Você tem somente permissão de autorizar a amostra.", error:true});              
                      //Ver se ele pode passar essa amostra de 1 para 2
                      check = await Solicitation.query().whereRaw(`user_id = ${auth.user.id} AND status > 1 AND status < 7`).fetch();
                      check = JSON.parse(JSON.stringify(check));
                      if (check.length >= 4) {
                        // return response.status(200).json({message:"Você excedeu o seu limite de 4 análises de amostras simultânea. Por favor check se não há amostras para serem retiradas do laboratório.", error:true});                            
                      }else{
                        //Emails para o sasaki ou para o LRX?
                        
                        //Emails para ele mesmo?

                        await Solicitation.query().where('id', id).update({status:2});
                        // return response.status(200).json({message:"Amostra autorizada com sucesso!", error:false});                            
                      }

                    }

                  }else{
                    //Amostras do estudante
                    //Verificar se amostra não está no passo diferente do 1
                    if (solicitation.status == 1) {
                      // return response.status(200).json({message:"Você tem somente permissão de autorizar a amostra.", error:true});              
                    
                      check = await Database.table({ u:'users', ps:'professors_students', s:'solicitations'}).select({id:'s.id',}).whereRaw(`ps.professor_id = '${auth.user.id}' AND ps.studant_id = u.id AND s.user_id IN (u.id, '${auth.user.id}') AND s.status > 1 AND s.status < 7 `).groupBy('s.name').having('s.name', '<=', 2);
                      if (check.length >= 4) {
                        // return response.status(200).json({message:"Você excedeu o seu limite de 4 análises de amostras simultânea. Por favor check se não há amostras para serem retiradas do laboratório.", error:true});                            
                      }else{
                        await Solicitation.query().where('id', id).update({status:2});
                        // return response.status(200).json({message:"Amostra autorizada com sucesso!", error:false});
                      }
                    }
                  }
              break;
              default:
                // return response.status(406).json({message:"Usuário não autorizado", error:true});
              break;
            }

          return solicitation;
        }
      } catch (error) {
        //Mandar um alerta pra mim
      }

    }));

    return response.status(200).json({message:"Operação realizada com sucesso!", error:false, sol:sol});
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
          //Amostra está no estato 1
          if (solicitation.status != 1) {
            return response.status(200).json({message:'Amostra precisa estar no primeiro estado para ser cancelada.', error:true});
          }
          //Amostra é sua?
          if (auth.user.id == solicitation.user_id) {
            await Solicitation.query().where('name', name).update({status:-1});
            solicitation.status = -1;
          }else{
            //Você tem estudantes vinculados a você?
            let hasStudant = await ProfStudent.query().where({professor_id:auth.user.id, studant_id:solicitation.user_id}).fetch();
                hasStudant = JSON.parse(JSON.stringify(hasStudant));          
            if (hasStudant.length != 0 && hasStudant[0].studant_id != solicitation.user_id) {
              await Solicitation.query().where('name', name).update({status:-1});
              solicitation.status = -1;
            }
          }
      break;
      case 'tecnico':
      case 'financeiro':
          //do it later
          await Solicitation.query().where('name', name).update({status:-2});
          solicitation.status = -2;
      break;
      default:
          if (auth.user.id == solicitation.user_id) {
            await Solicitation.query().where('name', name).update({status:-1});
            solicitation.status = -1;
          }
      break;
    }

    return response.status(200).json({message:'Amostra canceladas com successo!', error:false, solicitation});
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
                  //Amostra é sua?
                  if (auth.user.id == solicitation.user_id) {
                    await Solicitation.query().where('id', id).update({status:-1});
                    solicitation.status = -1;
                  }else{
                    let hasStudant = await ProfStudent.query().where({professor_id:auth.user.id, studant_id:solicitation.user_id}).fetch();
                    hasStudant = JSON.parse(JSON.stringify(hasStudant));          
                    if (hasStudant.length != 0 && hasStudant[0].studant_id == solicitation.user_id) {
                        await Solicitation.query().where('id', id).update({status:-1});
                        solicitation.status = -1;
                    }
                  }
              break;
              case 'tecnico':
              case 'financeiro':
                //Fazer as críticas later   
                  await Solicitation.query().where('id', id).update({status:-1});
                  solicitation.status = -1;
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

  async proposta ({request, response, auth, view}) {
    let {data} = request.all();
    let array_drx = [], array_frx = [], referencia, start, end, res, valor_total, checkQtdPre;
    data = JSON.parse(decodeURIComponent(data));

    //Amostras que foram selecionadas na proposta
    let solicitation = await Solicitation.query().whereRaw(`id in (${data.solicitations.join()})`).orderBy('name', 'asc').fetch();
        solicitation = JSON.parse(JSON.stringify(solicitation));
    if (solicitation.length == 0) {
      return response.status(200).json({message:"Nenhuma amostra foi encontrada", error:true});
    }

    array_drx = solicitation.filter(v => v.method == 'DRX');
    array_frx = solicitation.filter(v => v.method == 'FRX');

    if (array_drx.length != 0) {
      //Caso queria selecionar da amostra inicial ate a quantidade informada
      if (data.qtdDrxMedida != null) {
        //Selecione somente 1 amostra para selecionar o restante so acrescentar o numero
        if (array_drx.length <= parseInt(data.qtdDrxMedida)) {
          referencia  = array_drx[0].name.slice(0, -3);
          start       = array_drx[0].name.slice(-3);
          end         = parseInt(start)+parseInt(data.qtdDrxMedida)-1;
          end         = ((end < 9) ? '00'+end : ((end > 9 && end < 99) ? '0'+end : end));
          res         = await Solicitation.query().whereRaw(`name BETWEEN '${referencia+start}' AND '${referencia+end}'`).fetch();
          array_drx   = JSON.parse(JSON.stringify(res));
        }
      }
    }

    if (array_frx.length != 0) {
      //Caso queria selecionar da amostra inicial ate a quantidade informada
      if (data.qtdFrxSemiQuantitativa != null) {
        //Selecione somente 1 amostra para selecionar o restante so acrescentar o numero
        if (array_frx.length <= parseInt(data.qtdFrxSemiQuantitativa)) {
          referencia  = array_frx[0].name.slice(0, -3);
          start       = array_frx[0].name.slice(-3);
          end         = parseInt(start)+parseInt(data.qtdFrxSemiQuantitativa)-1;
          end         = ((end < 9) ? '00'+end : ((end > 9 && end < 99) ? '0'+end : end));
          res         = await Solicitation.query().whereRaw(`name BETWEEN '${referencia+start}' AND '${referencia+end}'`).fetch();
          array_frx   = JSON.parse(JSON.stringify(res));
        }
      }
    }

    valor_total=0;

    //PRECOS FRX
    if (array_frx.length > 0) {
        data.qtdFrxSemiQuantitativa = array_frx.length;
        //Preco
        if (data.frxSemiQuantitativa == null) {
            data.frxSemiQuantitativa = ((data.qtdFrxSemiQuantitativa <= 3) ? 232.00 : ((data.qtdFrxSemiQuantitativa >= 4 && data.qtdFrxSemiQuantitativa <= 10) ? 193.00 : 155.00 ));
        }
    
        //Atualiza valor total
        valor_total+= parseFloat(data.frxSemiQuantitativa)*data.qtdFrxSemiQuantitativa;
    }else{
        data.qtdFrxSemiQuantitativa = 0;
        data.frxSemiQuantitativa = 0;
    }

    //PREÇOS DRX
    if (array_drx.length > 0) {
        data.qtdDrxMedida = array_drx.length;
        if (data.drxMedida == null) {
            data.drxMedida = ((data.qtdDrxMedida <= 3) ? 328.00 : ((data.qtdDrxMedida >= 4 && data.qtdDrxMedida <= 10) ? 274.00 : 219.00)); 
        }
        valor_total+=data.qtdDrxMedida*parseFloat(data.drxMedida);
    }

    //PRECO PREPARACAO DE AMOSTRA
    if (parseInt(data.qtdPreparacaoDeAmostras) > 0) {
        checkQtdPre = (((array_drx.length >0) ? array_drx.length : 0) + ((array_frx.length >0) ? array_frx.length : 0)); 
        
        if (checkQtdPre < parseInt(data.qtdPreparacaoDeAmostras)) {
            data.qtdPreparacaoDeAmostras = checkQtdPre;
        }

        if (data.preparacaoDeAmostras == null) {
            data.preparacaoDeAmostras = ((parseInt(data.qtdPreparacaoDeAmostras) <=3 ) ? 30.0 : ((parseInt(data.qtdPreparacaoDeAmostras) >=4 && parseInt(data.qtdPreparacaoDeAmostras) <=10) ? 20.0 : 10.0));        
        }
        valor_total+=data.qtdPreparacaoDeAmostras*parseFloat(data.preparacaoDeAmostras);
    }


    //PRECO IDENTIFICACAO DE FASE DRX
    if (data.qtdDrxIdentificacao != null) {
        if (data.drxIdentificacao == null) {
            data.drxIdentificacao = ((data.qtdDrxIdentificacao <= 3) ? 328.00 : ((data.qtdDrxIdentificacao >= 4 && data.qtdDrxIdentificacao <= 10) ? 274.00 : 219.00)); 
        }
        valor_total+=data.qtdDrxIdentificacao*parseFloat(data.drxIdentificacao);
    }

    //PRECO QUANTIFICACAO DE FASE DRX
    if (data.qtdDrxQuantificacao != null) {
        if (data.drxQuantificacao == null) {
            data.drxQuantificacao = ((data.qtdDrxQuantificacao <= 3) ? 584.50 : ((data.qtdDrxQuantificacao >= 4 && data.qtdDrxQuantificacao <= 10) ? 584.50 : 584.50)); 
        }
        valor_total+=data.qtdDrxQuantificacao*parseFloat(data.drxQuantificacao);
    }

    //PRECO CALCULO DE FASE DRX
    if (data.qtdDrxCalculo != null) {
        if (data.drxCalculo == null) {
            data.drxCalculo = ((data.qtdDrxCalculo <= 3) ? 584.50 : ((data.qtdDrxCalculo >= 4 && data.qtdDrxCalculo <= 10) ? 584.50 : 584.50)); 
        }
        valor_total+=data.qtdDrxCalculo*parseFloat(data.drxCalculo);
    }

    //Lista de amostras
    let list = [];
    array_drx.map(v => {
      list.push(v.name)
    })

    array_frx.map(v => {
      list.push(v.name)
    })

    list = list.join();

    //USER
    let full = {};
    let user_id = (array_frx.length > 0) ? array_frx[0].user_id : array_drx[0].user_id;
    let user = await User.findBy('id', user_id)
        await user.load('company');
        await user.load('address');
        user = JSON.parse(JSON.stringify(user));
    if (user.access_level_slug == 'tecnico' || user.access_level_slug == 'financeiro') {
      full.name         = user.company[0].company_name;
      full.doc          = user.company[0].cnpj;
      full.street       = user.company[0].street;
      full.number       = user.company[0].number;
      full.cep          = user.company[0].cep;
      full.neighborhood = user.company[0].neighborhood;
      full.city         = user.company[0].company_city;
      full.state        = user.company[0].company_state;
    }else if(user.access_level_slug == 'autonomo'){
      full.name         = user.name;
      full.doc          = user.cpf;
      full.street       = user.address.street_address;
      full.number       = user.address.number_address;
      full.cep          = user.address.cep_address;
      full.neighborhood = user.address.neighborhood_address;
      full.city         = user.address.city_address;
      full.state        = user.address.state_address;
    }else{
      return response.status(200).json({message:"Usuário não pode redecer proposta.", error:true})
    }


    //Diff Between dates
    const diffDays = date_diff(data.dataPrazo);
    const numDoc    = await doc_number(user_id);
 
    return view.render('propostas', {data, full, list, valor_total, formatMoney, array_frx, array_drx, diffDays, date:formatDate(new Date), numDoc});
  }

  /* 
  * Função para gerar o documento de ordem de serviços
  */
  async ordem ({request, response, auth, view}) {
    let {data} = request.all();
    let array_drx = [], array_frx = [], referencia, start, end, res, valor_total, checkQtdPre;
    data = JSON.parse(decodeURIComponent(data));

    //Amostras que foram selecionadas na proposta
    let solicitation = await Solicitation.query().whereRaw(`id in (${data.solicitations.join()})`).orderBy('name', 'asc').fetch();
        solicitation = JSON.parse(JSON.stringify(solicitation));
    if (solicitation.length == 0) {
      return response.status(200).json({message:"Nenhuma amostra foi encontrada", error:true});
    }

    array_drx = solicitation.filter(v => v.method == 'DRX');
    array_frx = solicitation.filter(v => v.method == 'FRX');

    if (array_drx.length != 0) {
      //Caso queria selecionar da amostra inicial ate a quantidade informada
      if (data.qtdDrxMedida != null) {
        //Selecione somente 1 amostra para selecionar o restante so acrescentar o numero
        if (array_drx.length <= parseInt(data.qtdDrxMedida)) {
          referencia  = array_drx[0].name.slice(0, -3);
          start       = array_drx[0].name.slice(-3);
          end         = parseInt(start)+parseInt(data.qtdDrxMedida)-1;
          end         = ((end < 9) ? '00'+end : ((end > 9 && end < 99) ? '0'+end : end));
          res         = await Solicitation.query().whereRaw(`name BETWEEN '${referencia+start}' AND '${referencia+end}'`).fetch();
          array_drx   = JSON.parse(JSON.stringify(res));
        }
      }
    }

    if (array_frx.length != 0) {
      //Caso queria selecionar da amostra inicial ate a quantidade informada
      if (data.qtdFrxSemiQuantitativa != null) {
        //Selecione somente 1 amostra para selecionar o restante so acrescentar o numero
        if (array_frx.length <= parseInt(data.qtdFrxSemiQuantitativa)) {
          referencia  = array_frx[0].name.slice(0, -3);
          start       = array_frx[0].name.slice(-3);
          end         = parseInt(start)+parseInt(data.qtdFrxSemiQuantitativa)-1;
          end         = ((end < 9) ? '00'+end : ((end > 9 && end < 99) ? '0'+end : end));
          res         = await Solicitation.query().whereRaw(`name BETWEEN '${referencia+start}' AND '${referencia+end}'`).fetch();
          array_frx   = JSON.parse(JSON.stringify(res));
        }
      }
    }

    valor_total=0;

    //PRECOS FRX
    if (array_frx.length > 0) {
        data.qtdFrxSemiQuantitativa = array_frx.length;
        //Preco
        if (data.frxSemiQuantitativa == null) {
            data.frxSemiQuantitativa = ((data.qtdFrxSemiQuantitativa <= 3) ? 232.00 : ((data.qtdFrxSemiQuantitativa >= 4 && data.qtdFrxSemiQuantitativa <= 10) ? 193.00 : 155.00 ));
        }
    
        //Atualiza valor total
        valor_total+= parseFloat(data.frxSemiQuantitativa)*data.qtdFrxSemiQuantitativa;
    }else{
        data.qtdFrxSemiQuantitativa = 0;
        data.frxSemiQuantitativa = 0;
    }

    //PREÇOS DRX
    if (array_drx.length > 0) {
        data.qtdDrxMedida = array_drx.length;
        if (data.drxMedida == null) {
            data.drxMedida = ((data.qtdDrxMedida <= 3) ? 328.00 : ((data.qtdDrxMedida >= 4 && data.qtdDrxMedida <= 10) ? 274.00 : 219.00)); 
        }
        valor_total+=data.qtdDrxMedida*parseFloat(data.drxMedida);
    }

    //PRECO PREPARACAO DE AMOSTRA
    if (parseInt(data.qtdPreparacaoDeAmostras) > 0) {
        checkQtdPre = (((array_drx.length >0) ? array_drx.length : 0) + ((array_frx.length >0) ? array_frx.length : 0)); 
        
        if (checkQtdPre < parseInt(data.qtdPreparacaoDeAmostras)) {
            data.qtdPreparacaoDeAmostras = checkQtdPre;
        }

        if (data.preparacaoDeAmostras == null) {
            data.preparacaoDeAmostras = ((parseInt(data.qtdPreparacaoDeAmostras) <=3 ) ? 30.0 : ((parseInt(data.qtdPreparacaoDeAmostras) >=4 && parseInt(data.qtdPreparacaoDeAmostras) <=10) ? 20.0 : 10.0));        
        }
        valor_total+=data.qtdPreparacaoDeAmostras*parseFloat(data.preparacaoDeAmostras);
    }


    //PRECO IDENTIFICACAO DE FASE DRX
    if (data.qtdDrxIdentificacao != null) {
        if (data.drxIdentificacao == null) {
            data.drxIdentificacao = ((data.qtdDrxIdentificacao <= 3) ? 328.00 : ((data.qtdDrxIdentificacao >= 4 && data.qtdDrxIdentificacao <= 10) ? 274.00 : 219.00)); 
        }
        valor_total+=data.qtdDrxIdentificacao*parseFloat(data.drxIdentificacao);
    }

    //PRECO QUANTIFICACAO DE FASE DRX
    if (data.qtdDrxQuantificacao != null) {
        if (data.drxQuantificacao == null) {
            data.drxQuantificacao = ((data.qtdDrxQuantificacao <= 3) ? 584.50 : ((data.qtdDrxQuantificacao >= 4 && data.qtdDrxQuantificacao <= 10) ? 584.50 : 584.50)); 
        }
        valor_total+=data.qtdDrxQuantificacao*parseFloat(data.drxQuantificacao);
    }

    //PRECO CALCULO DE FASE DRX
    if (data.qtdDrxCalculo != null) {
        if (data.drxCalculo == null) {
            data.drxCalculo = ((data.qtdDrxCalculo <= 3) ? 584.50 : ((data.qtdDrxCalculo >= 4 && data.qtdDrxCalculo <= 10) ? 584.50 : 584.50)); 
        }
        valor_total+=data.qtdDrxCalculo*parseFloat(data.drxCalculo);
    }

    //Lista de amostras
    let listDRX = [], listFRX = [];
    array_drx.map(v => {
      listDRX.push(v.name)
    })

    array_frx.map(v => {
      listFRX.push(v.name)
    })

    listDRX = listDRX.join();
    listFRX = listFRX.join();

    //USER
    let full = {};
    let user_id = (array_frx.length > 0) ? array_frx[0].user_id : array_drx[0].user_id;
    let user = await User.findBy('id', user_id)
        await user.load('company');
        await user.load('address');
        user = JSON.parse(JSON.stringify(user));
    if (user.access_level_slug == 'tecnico' || user.access_level_slug == 'financeiro') {
      full.name         = user.company[0].company_name;
      full.doc          = user.company[0].cnpj;
      full.street       = user.company[0].street;
      full.number       = user.company[0].number;
      full.cep          = user.company[0].cep;
      full.neighborhood = user.company[0].neighborhood;
      full.city         = user.company[0].company_city;
      full.state        = user.company[0].company_state;
      full.phone        = user.company[0].company_phone;
      full.email        = user.company[0].company_email;
      full.sr           = user.company[0].state_registration == null ? user.company[0].state_registration : '';
    }else if(user.access_level_slug == 'autonomo'){
      full.name         = user.name;
      full.doc          = user.cpf;
      full.street       = user.address.street_address;
      full.number       = user.address.number_address;
      full.cep          = user.address.cep_address;
      full.neighborhood = user.address.neighborhood_address;
      full.city         = user.address.city_address;
      full.state        = user.address.state_address;
    }else{
      return response.status(200).json({message:"Usuário não pode redecer proposta.", error:true})
    }


    //dar o número do documento
    let numDoc    = await doc_number(user_id);

    //Array dos serviços
    let relatorio = [];

    if (array_frx.length > 0) {
      relatorio.push({
        desc:'Fluorescência de raios-x (FRX): Semi-quantitativa',
        qtd:array_frx.length,
        preco:data.frxSemiQuantitativa,
        total:data.qtdFrxSemiQuantitativa*data.frxSemiQuantitativa,
        list:listFRX
      })
    }

    if (array_drx.length > 0) {
      if (data.qtdDrxMedida > 0) {        
        relatorio.push({
          desc:'Difração de raios-x (DRX): Medida',
          qtd:array_drx.length,
          preco:data.drxMedida,
          total:data.qtdDrxMedida*data.drxMedida,
          list:listDRX
        })
      }

      if (data.qtdDrxIdentificacao > 0) {
        relatorio.push({
          desc:'Difração de raios-x (DRX): Identificação de Fases',
          qtd:data.qtdDrxIdentificacao,
          preco:data.drxIdentificacao,
          total:data.qtdDrxIdentificacao*data.drxIdentificacao,
          list:''
        })
      }

      if (data.qtdDrxQuantificacao > 0) {
        relatorio.push({
          desc:'Difração de raios-x (DRX): Quantificação de Fases - Método Rietveld',
          qtd:data.qtdDrxQuantificacao,
          preco:data.drxQuantificacao,
          total:data.qtdDrxQuantificacao*data.drxQuantificacao,
          list:''
        })
      }

      if (data.qtdDrxCalculo > 0) {
        relatorio.push({
          desc:'Difração de raios-x (DRX): Cálculo de Tamanho médio de partículas',
          qtd:data.qtdDrxCalculo,
          preco:data.drxCalculo,
          total:data.qtdDrxCalculo*data.drxCalculo,
          list:''
        })
      }

    }

    if (data.qtdPreparacaoDeAmostras > 0) {
      relatorio.push({
        desc:'Preparação de Amostras',
        qtd:data.qtdPreparacaoDeAmostras,
        preco:data.preparacaoDeAmostras,
        total:data.qtdPreparacaoDeAmostras*data.preparacaoDeAmostras,
        list:''
      })
    }

    return view.render('ordem', {data, full, valor_total, user, relatorio, formatMoney,  date:formatDate(new Date()), numDoc});
  }


  //Head of dashboard
  async head_dash({request, auth}) {

    try {
      await auth.check()
    } catch (error) {
      console.log(error);
    }

    const {page=1, perPage=10} = request.all();
    let users, drx, frx, online;
    let data = [];
    if (auth.user.access_level_slug == 'administrador') {
      users = await User.query().where('status', 1).paginate(page, perPage);
      drx   = await Solicitation.query().where('method', 'DRX').andWhere('status', '>=', 1).paginate(page, perPage);
      frx   = await Solicitation.query().where('method', 'FRX').andWhere('status', '>=', 1).paginate(page, perPage);
      online= getRandom(15);
    }else{
      users = {total:1};
      drx   = await Solicitation.query().where('method', 'DRX').andWhere('status', '>=', 1).andWhere('user_id', auth.user.id).paginate(page, perPage);
      frx   = await Solicitation.query().where('method', 'FRX').andWhere('status', '>=', 1).andWhere('user_id', auth.user.id).paginate(page, perPage);
      online= getRandom(15);
    }
    
    data.push({tipo:'online', count:online});
    data.push({tipo:'users', count:conv(users).total});
    data.push({tipo:'drx', count:conv(drx).total});
    data.push({tipo:'frx', count:conv(frx).total});
    return data;
  } 

}

module.exports = SolicitationController
