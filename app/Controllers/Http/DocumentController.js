'use strict'

const Document 	= use('App/Models/Document')
const User 		= use('App/Models/User')
const Company 	= use('App/Models/CompanyDatum');
const Mail 		= use('Mail');
const Env		= use('Env');
const Request 	= use('request');
const {
	conv
  } = use('App/Helpers');
class DocumentController {

  async index({ request, response, auth}) {
    const docs = await Document.query().with('user').orderBy('created_at', 'DESC').fetch()
    return response.json(docs)
  }

  async index_proposta ({request, response, auth}) {
  	const {user_id} = request.all();
	let doc
  	//Para listar todas as propostas independente do usuário
	let user = await User.findBy('id', user_id);
	switch (user.toJSON().access_level_slug) {
		case 'administrador':
		case 'operador':
		case 'autonomo':
			doc = await Document.query().where('user_id', user.toJSON().id).with('user').fetch();
			return doc;
		break;
		case 'professor':
		case 'aluno':
			doc = await Document.query().where('user_id', user.toJSON().id).with('user').fetch();
			return doc;
		break;
		case 'tecnico':
		case 'financeiro':
			await user.load('company');
			user = JSON.parse(JSON.stringify(user));
			let users = await Company.findBy('id', user.company[0].id);
			await users.load('users');
			users = JSON.parse(JSON.stringify(users));
			users = users.users;
			let listUsers = [];
			users.map(v => {
				listUsers.push(v.id);
			})
			users = listUsers.join();

			doc = await Document.query().whereRaw(`user_id in (${users})`).with('user').fetch();

			return doc;
		break;
	}

  }

  async store_proposta ({request, response, auth}) {
  	let {user_id, url} = request.all();
	let data = JSON.parse(decodeURIComponent(url));

	if (data.name) {
		let user_id_name = await User.query().where('name', 'like', `%${data.name}%`).fetch()
		if (user_id_name.toJSON().length > 0) {
			user_id = user_id_name.toJSON()[0].id
		}
	}

  //Selecionar user
	const user = await User.findBy('id', user_id);


  	//Enviar email para user
	  Mail.send('emails.sendProposta', {user, url:`${Env.get('APP_URL_PROD')}/api/solictation/proposta?data=${url}`}, (message) => {
		message
			.to(user.email)
			.from('<from-email>')
			.subject('SLRX - UFC | Proposta LRX')
	});

  	//Gravar no banco
  	await Document.create({user_id, type:'proposta', url});

  	//Returno to page
  	return response.status(200).json({message:"Proposta enviada com sucesso!", error:false});
  }

  async delete_proposta({request, response, auth}){
	  const {id} = request.all();

	  if (auth.user.access_level_slug != 'administrador') {
		  return response.status(200).json({message:"Usuário não autorizado!", error:true});
	  }

	  await Document.query().where('id', id).delete();
	  return response.status(200).json({message:"Proposta deletada com sucesso!", error:false});
  }

  async email({request, response, auth}){
	  const data = request.only(['message', 'subject', 'to']);
	  console.log(data.to.join("','"))

	  if (auth.user.access_level_slug != 'administrador' && auth.user.access_level_slug != 'operador') {
		return response.status(200).json({message:"Usuário não autorizado!", error:true});
	  }

	  const users = await User.query().whereRaw(`access_level_slug IN ('${data.to.join("','")}') AND status = 1 AND confirm = 1 AND confirm_email = 1 AND id != 1`).fetch();
	//   conv(users).map((user,i) => {
	// 	  console.log(user.email, user.id)
	// 	  Mail.send('emails.sendEmail', {...data}, (message) => {
	// 		message
	// 			.to(user.email)
	// 			.from('<from-email>')
	// 			.subject(`SLRX - UFC | ${data.subject}`)
	// 		});
	// 	})

	users.toJSON().map((user,i) => {
		console.log(user.email, user.id)
		let email = user.email;
		let dados = {assunto:`SLRX | ${data.subject}`, corpo:data.message, email};
		let op = {
			url:'http://csdint.fisica.ufc.br/solicitacoes/send-email.php',
			form: {email:JSON.stringify(dados)}
		};
		Request.post(op, (err,httpResponse,body) =>{
			console.log(body);
		});
	})

	return response.status(200).json({message:"Emails enviados com sucesso!", error:false});

  }

}

module.exports = DocumentController
