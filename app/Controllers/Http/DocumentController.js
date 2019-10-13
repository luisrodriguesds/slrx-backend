'use strict'

const Document = use('App/Models/Document')

class DocumentController {
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
