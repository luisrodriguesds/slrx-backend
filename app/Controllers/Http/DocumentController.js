'use strict'

const Document 	= use('App/Models/Document')
const User 		= use('App/Models/User')
const Company 		= use('App/Models/CompanyDatum');

class DocumentController {
  
  async index_proposta ({request, response, auth}) {
  	const {user_id} = request.all();

  	//Para listar todas as propostas independente do usuário
  	let user = await User.findBy('id', user_id);
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

  	let doc = await Document.query().whereRaw(`user_id in (${users})`).with('user').fetch();

  	return doc;
  }

  async store_proposta ({request, response, auth}) {
  	const {user_id, url} = request.all();
  	
  	//Selecionar user
  	
  	//Enviar email para user

  	//Gravar no banco
  	const res = await Document.create({user_id, url, type:'proposta'});

  	//Returno to page
  	return response.status(200).json({message:"Proposta enviada com sucesso!", error:false});
  }

}

module.exports = DocumentController
