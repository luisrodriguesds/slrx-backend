'use strict'
const User 			= use('App/Models/User');
const Academy 		= use('App/Models/AcademicDatum');
const Company 		= use('App/Models/CompanyDatum');
const ProfStudent 	= use('App/Models/ProfessorsStudent');
const Address 		= use('App/Models/Address');
const CompanyUser 	= use('App/Models/CompaniesUser');
const RequestPass 	= use('App/Models/RequestPass');
const Mail 			= use('Mail');
const Env 			= use('Env');
const { validate } 	= use('Validator');
const Hash 			= use('Hash');
const Database 		= use('Database')
const Helpers 		= use('Helpers')

const {
	conv,
	studants
  } = use('App/Helpers');
class UserController {

	async index({response,request, auth}){
    	const {page=1, perPage=50} = request.all();
		let user;
		switch(auth.user.access_level_slug){
			case "operador":
			case "administrador":
				user = await User.query().where('id', '!=', '1').orderBy('created_at', 'desc').paginate(page, perPage);
		        return user;
			break;
			case "professor":
				//Procurar os alunos desse professor. Melhor algoritmo para isso
				let professor = await ProfStudent.query().where('professor_id', auth.user.id).andWhere('status', 1).fetch();
				professor =  conv(professor);
				if (professor.length == 0) {
					return response.status(200).json({data:[], lastPage:'', page:1, total:0, perPage:''});
				}

				let studant_id = []
				for (let i = 0; i < professor.length; i++) {
					studant_id.push(professor[i].studant_id);
				}

				studant_id = studant_id.join(',');

				let studant = await User.query().whereRaw(`id IN (${studant_id})`).orderBy('created_at', 'desc').paginate(page, perPage);
				return studant;
			break;
		}
	}

	async show({request, response, auth}){
		let {id} = request.all();
		let user;

		if (id == 'undefined' || id == undefined) {
			return response.status(200).json({solicitations:[]});
		}

		switch(auth.user.access_level_slug){
			case "operador":
			case "administrador":
				if (id.indexOf("company") == 0) {
					id = id.replace("company-","");
					let company = await Company.findBy('id', id);
					if (company == null) {
        				return response.status(200).json({message:"Nenhum Usuário encontrado", error:true});
					}
					await company.load('users');

					company = JSON.parse(JSON.stringify(company));

		            let solicitations = await Database.table({
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
		              }).whereRaw(`cu.company_datum_id = '${company.id}' AND cu.user_id = u.id AND s.user_id = u.id AND s.equipment_id = e.id`)
		              .orderByRaw('s.name ASC')
			        
					user = {
						name:company.fantasy_name,
						access_level:'Empresa',
						access_level_slug:'empresa',
						email:company.company_email,
						phone1:company.company_phone,
						cnpj:company.cnpj,
						employees:company.users,
						solicitations,
						photo:'/assets/img/avatar/avatar-1.png'
					}
					return {user};
				}else{
					user = await User.findBy('id', id);
					await user.load('address')
					await user.load('academic')
					await user.load('company')
					await user.load('solicitations')
			
					return response.status(200).json({
						user:{
							...user.toJSON(),
							academic: user.toJSON().academic &&  {
								...user.toJSON().academic,
								email_leader: await user.toJSON().academic.email_leader
							},
							company: user.toJSON().company && {
								...user.toJSON().company[0],
								type_company: user.access_level_slug
							}
						}
					})
				}
			break;
			case "professor":
				user = await User.findBy('id', id);
				await user.load('address')
				await user.load('academic')
				await user.load('company')
				await user.load('solicitations')
		
				return response.status(200).json({
					user:{
						...user.toJSON(),
						academic: user.toJSON().academic &&  {
							...user.toJSON().academic,
							email_leader: await user.toJSON().academic.email_leader
						},
						company: user.toJSON().company && {
							...user.toJSON().company[0],
							type_company: user.access_level_slug
						}
					}
				})
			break;
		}
	}

	async pedding({request, response, auth}){
		const {id} = request.all();
		await auth.check();
		if (auth.user.access_level_slug != 'administrador' && auth.user.access_level_slug != 'operador'  && auth.user.access_level_slug != 'professor') {
			return response.status(200).json({message:"Usuário não autorizado", error:true});
		}

		await User.query().where('id', id).update({confirm:1, confirm_email:1, status:1});
		await ProfStudent.query().where('studant_id', id).update({status:1});
    return response.status(200).json({message:"Operação realizada com sucesso", error:false});
	}

	
	async token({response, auth}){
		
		try {
			await auth.check();
			
			let user = await User.findBy('id', auth.user.id);
			await user.load('address')
			await user.load('academic')
			await user.load('company')
	
			return response.status(200).json({
				user:{
					...user.toJSON(),
					academic: user.toJSON().academic &&  {
						...user.toJSON().academic,
						email_leader: await user.toJSON().academic.email_leader
					},
					company: user.toJSON().company && {
						...user.toJSON().company[0]
					}
				}, 
				error:false
			})
			
		} catch (error) {
			return response.status(403).json({message:"Usuário não está logado", error:true});
		}
  }

	async authentication({request, response, auth}){
		const {email, password} = request.all();
		
		//Validation
		//Rules
		let rules = {
			email: 'required|email',
			password: 'required|min:8'
		}

		//Validation
		let validation = await validate({email, password}, rules);
		if (validation.fails()) {
			return response.status(200).json({...validation.messages()[0], error:true});
		}

		//Check conform and email confirm
		let user = await User.findBy('email', email);
		if(user == null){
	    	return response.status(200).json({message:"Usuário não encontrado", error:true}); 			
		}else if (user.toJSON().confirm == 0) {
			return response.status(200).json({message:"Responsável pelo Laboratório ainda não aprovou a liberação de seu acesso, entre em contato.", error:true}); 
		}else if (user.toJSON().confirm_email == 0) {
			return response.status(200).json({message:"Email ainda não foi confirmado. Acesse sua caixa de entrada e libere seu cadastro.", error:true}); 
		}else if (user.toJSON().status == 0) {
	    return response.status(200).json({message:"Essa conta foi desativada. Entre em contato com o responsável pelo Laboratório.", error:true}); 
		}

		try {
			const token = await auth.attempt(email, password);
			return response.status(200).send({token:token.token, user});
		} catch (error) {
	    	return response.status(200).json({message:"Senha incorreta! Tente novamente ou clique em esqueci minha senha!", error:true}); 			
		}
  }

  async logout({auth }) { 
	  await auth.check()
	  const token = auth.getAuthHeader()
    return await auth.revokeTokens([token]);
  }

	async picture({response,request, auth}){
		let {id} = request.all();

		// console.log(id);
		await auth.check();

		if (auth.user.id != id && auth.user.access_level_slug != 'administrador') {
			return response.status(200).json({message:"Usuário não autorizado", })
		}

		let picture = request.file('picture', {
                extnames: ['png', 'jpg', 'jpeg', 'gif'],
                size: '2mb'
	      });

	      // console.log(sample);
	      if (picture === null) {
	        return response.status(200).json({message:"Foto Obrigatória", error:true});
	      }

	      const {extname} = picture;
	      let name = `${Date.now().toString()}.${extname}`;
	      await picture.move(Helpers.tmpPath('pictures'), {
	        name,
	        overwrite: true
	      });
	    
	      if (!picture.moved()) {
	        return response.status(200).json({message:picture.error().message, error:true});
	      }

	      await User.query().where('id', id).update({photo:name});

	      return response.status(200).json({message:"Foto enviada com sucesso", erro:false});
  	}

  	async show_picture({request, response, params}){
	    return response.download(Helpers.tmpPath(`pictures/${params.path}`))
	}

	async filter({request, response, auth}){
		const {filter, page=1, perPage=50} = request.all();

		switch(auth.user.access_level_slug){
			case "operador":
			case "administrador":
				const user = await User.query().whereRaw(`id != 1 AND name LIKE '%${filter}%' OR id != 1 AND email LIKE '%${filter}%'`).orderBy('created_at', 'desc').paginate(page, perPage);
		        return user;
			break;
			case "professor":
				//Procurar os alunos desse professor. Melhor algoritmo para isso
				let professor = await ProfStudent.query().where('professor_id', auth.user.id).andWhere('status', 1).fetch();
				professor =  conv(professor);
				if (professor.length == 0) {
					return response.status(200).json([]);
				}

				let studant_id = []
				for (let i = 0; i < professor.length; i++) {
					studant_id.push(professor[i].studant_id);
				}

				studant_id = studant_id.join(',');

				let studant = await User.query().whereRaw(`id IN (${studant_id}) AND name LIKE '%${filter}%' OR id IN (${studant_id}) AND email LIKE '%${filter}%' `).orderBy('created_at', 'desc').paginate(page, perPage);
				return studant;
			break;
		}

  	}

  	async filterby({request, response, auth}){
		const {filter, page=1, perPage=50} = request.all();
		let users;
		switch(filter){
			case "Filtro":
				users = await User.query().where('id', '!=', '1').orderBy('name', 'asc').paginate(page, perPage);
			break;
			case "Professores":
				users = await User.query().where('access_level_slug', '=', 'professor').orderBy('name', 'asc').paginate(page, perPage);
			break;
			case "Alunos":
				users = await User.query().where('access_level_slug', '=', 'aluno').orderBy('name', 'asc').paginate(page, perPage);
			break;
			case "Operadores":
				users = await User.query().where('access_level_slug', '=', 'operador').orderBy('name', 'asc').paginate(page, perPage);
			break;
			case "Empresas":
				//Exibir empresa adapdando para usuário
				// id = company-${id}
				//company_name ->  name
				//access_level -> add
				//company_email -> email
				users = await Company.query().orderBy('created_at', 'desc').paginate(page, perPage);
				users = JSON.parse(JSON.stringify(users));
				users.data = users.data.map((user) => (
					user = {id:`company-${user.id}`, name:user.company_name, access_level:'Empresa', email:`${user.company_email}`, created_at:user.created_at, status:user.status}
				));
			break;
			case "Funcionários":
				users = await User.query().where('access_level_slug', '=', 'financeiro').orWhere('access_level_slug', '=', 'tecnico').orderBy('created_at', 'desc').paginate(page, perPage);
			break;
			case "Usuários Pendentes":
				users = await User.query().where('status', '=', '0').orWhere('confirm', '=', '0').orWhere('confirm_email', '=','0').orderBy('updated_at', 'desc').paginate(page, perPage);
			break;
			case "pendentes":
				if (auth.user.access_level_slug == 'professor') {
					let studant;
					let professor = await ProfStudent.query().where('professor_id', auth.user.id).fetch();
					professor =  JSON.parse(JSON.stringify(professor));
					if (professor.length == 0) {
					return response.status(200).json({data:[]});
					}

					let studant_id = []
					for (let i = 0; i < professor.length; i++) {
					studant_id.push(professor[i].studant_id);
					}

					studant_id = studant_id.join(',');

					users = await User.query().whereRaw(`id IN (${studant_id}) AND confirm = 0 OR  id IN (${studant_id}) AND confirm_email = 0`).paginate(page, perPage);
					
					// users = await User.query().where('confirm', '=', '0').orWhere('confirm_email', '=','0').orderBy('updated_at', 'desc').paginate(page, perPage);					
				}else{
					users = await User.query().where('confirm', '=', '0').orWhere('confirm_email', '=','0').orderBy('updated_at', 'desc').paginate(page, perPage);
				}
			break;
		}

		return users;
  	}

	async create({request, response}){
		const data = request.only([
			'name',
			'email', 
			'password',
			'cpf', 
			'birthday', 
			'sex', 
			'state', 
			'city', 
			'phone1',
			'phone2',
			'other_email'
		]);
		let { level } = request.all()
		let { academic } = request.all()
		let { address } = request.all()
		let { company } = request.all()

		let rules, validation

		if (level == 'aluno' || level == 'professor') {
			rules = {
				ies:'required',
				department:'required',
				title:'required|in:Graduando,Graduado,Especializando,Especialista,Mestrando,Mestre,Doutorando,Doutor',
				laboratory:'required',
				research:'required',
				description:'required'
			}

			validation = await validate(academic, rules);
			if (validation.fails()) {
				return response.status(400).json(validation.messages())
			}
		} 
		
		if (level != 'empresa') {
			rules = {
				cep_address:'required',
				street_address:'required',
				neighborhood_address:'required',
				number_address:'required',
				city_address:'required',
				state_address:'required'
			}

			validation = await validate(address, rules);
			if (validation.fails()) {
				return response.status(400).json(validation.messages());
			}
		}

		if (level == 'empresa') {
			rules = {
				cnpj:'required|min:18|max:18',
				fantasy_name:'required',
				company_name:'required',
				company_email:'required',
				company_phone:'required',
				cep:'required',
				street:'required',
				neighborhood:'required',
				number:'required',
				company_city:'required',
				company_state:'required',
				type_company: 'required|in:tecnico,financeiro'
			}
			validation = await validate(company, rules);
			if (validation.fails()) {
				return response.status(400).json(validation.messages());
			}
		}

		switch (level) {
			case 'aluno':
				const { email_leader } = academic
				delete academic.email_leader
				
				//Check if the professor is registered and if he has more than 20 studant registed
				let email_professor = await User.query()
					.select('id', 'name', 'email', 'access_level_slug', 'confirm')
					.where({email:email_leader, access_level_slug:"professor", confirm:1})
					.orWhere({email:email_leader, access_level_slug:"administrador", confirm:1})
					.first()
				
				if (email_professor == null) {
					return response.status(403).send({ message: "Esse professor/orientador não tem cadastro válido com o email informado. Por favor, digite um email de orientador de uma conta válida." })
				}
				
				let count_studant = await ProfStudent.query()
					.where({ professor_id:email_professor.id, status:1})
					.fetch()

				if (count_studant != null) {
					if (count_studant.toJSON().length >= 20) {
			    		return response.status(403).json({message:"Esse professor/orientador já excedeu o limite de 20 alunos ativos."});
					}
				}

				try {
					let { id } = await User.create({...data, status: 0, access_level: "Aluno", access_level_slug: level});
					await Academy.create({...academic, user_id: id})
					await Address.create({ ...address, user_id: id })
					await ProfStudent.create({ professor_id: email_professor.id, studant_id: id, status: 0 });
					return response.status(200).json({
						message: `Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. Além disso, foi enviado um email para ${email_leader}, seu orientador, solicitando que ele confirme seu vinculo para que você possa cadastrar suas amostras no sistema.`
					})
				} catch (error) {
					console.log(error)
					return response.status(500).json({message: "Algo inesperado aconteceu! Por favor tente novamente mais tarde."});
				}

				break;
			case 'professor':
				try {
					let { id } = await User.create({...data, status: 0, access_level: "Professor", access_level_slug: level});
					await Academy.create({...academic, user_id: id})
					await Address.create({ ...address, user_id: id })
					return response.status(200).json({
						message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação ou não do seu cadastro.`
					})
				} catch (error) {
					console.log(error)
					return response.status(500).json({message: "Algo inesperado aconteceu! Por favor tente novamente mais tarde."});
				}
			break;
			case 'empresa':
				//Check if the cnpj exist and if is bond
				try {
					const { type_company } = company
					delete company.type_company

					let checkCompany = await Company.query().where('cnpj', company.cnpj).first()
					if (checkCompany == null) {
						company = await Company.create({...company})
					}else{
						company = checkCompany.toJSON()
					}

					data.access_level = (type_company == 'tecnico') ? 'Técnico' : 'Financeiro'
					const { id } = await User.create({...data, status: 0, access_level_slug: type_company, frx_permission:1 })
					await CompanyUser.create({ company_datum_id: company.id, user_id: id })
					return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação do seu cadastro.`});

				} catch (error) {
					console.log(error)
					return response.status(500).json({message: "Algo inesperado aconteceu! Por favor tente novamente mais tarde."});
				}
				
				break;
	    case "autonomo":
				try {
					const { id } = await User.create({...data, status: 0, access_level: "Autônomo", access_level_slug: level, frx_permission:1 })
					await Address.create({ ...address, user_id: id })
					return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação do seu cadastro.` });
				} catch (error) {
					console.log(error)
					return response.status(500).json({message: "Algo inesperado aconteceu! Por favor tente novamente mais tarde."});
				}
				break;
			default:
			break;
		}
	}

	async update({request, response, auth}){
		const data = request.only([
			'id',
			'name',
			'email', 
			'password',
			'cpf', 
			'birthday', 
			'sex', 
			'state', 
			'city', 
			'phone1',
			'phone2',
			'other_email'
		])
		let { level } = request.all()
		let { academic } = request.all()
		let { address } = request.all()
		let { company } = request.all()

		let rules, validation, ac

		if (level == 'aluno' || level == 'professor') {
			rules = {
				ies:'required',
				department:'required',
				title:'required|in:Graduando,Graduado,Especializando,Especialista,Mestrando,Mestre,Doutorando,Doutor',
				laboratory:'required',
				research:'required',
				description:'required'
			}

			validation = await validate(academic, rules);
			if (validation.fails()) {
				return response.status(400).json(validation.messages())
			}
		} 
		
		if (level != 'empresa') {
			rules = {
				cep_address:'required',
				street_address:'required',
				neighborhood_address:'required',
				number_address:'required',
				city_address:'required',
				state_address:'required'
			}

			validation = await validate(address, rules);
			if (validation.fails()) {
				return response.status(400).json(validation.messages());
			}
		}

		if (level == 'empresa') {
			rules = {
				cnpj:'required|min:18|max:18',
				fantasy_name:'required',
				company_name:'required',
				company_email:'required',
				company_phone:'required',
				cep:'required',
				street:'required',
				neighborhood:'required',
				number:'required',
				company_city:'required',
				company_state:'required',
				type_company: 'required|in:tecnico,financeiro'
			}
			validation = await validate(company, rules);
			if (validation.fails()) {
				return response.status(400).json(validation.messages());
			}
		}

		if (auth.user.access_level_slug == 'administrador' || auth.user.access_level_slug == 'operador') {
			data.confirm 		= request.input('confirm')
			data.confirm_email 	= request.input('confirm_email')
			data.drx_permission = request.input('drx_permission')
			data.frx_permission = request.input('frx_permission')
			data.limit 			= request.input('limit')
			data.status 		= request.input('status')
		}

		switch (level) {
			case 'aluno':
			case 'professor':
				const { email_leader } = academic
				delete academic.email_leader

				//Check if is adm end check if field email_leader changed
				if (auth.user.access_level_slug == 'administrador' || auth.user.access_level_slug == 'operador') {
					if (level == 'aluno') {
						let prof = await User.query().whereRaw(`email = '${email_leader}' AND access_level_slug IN ('professor', 'administrador', 'operador')`).first();
						if (prof == null) {
							return response.status(200).json({message:"Professor não encontrado"})
						}

						let profStudent = await ProfStudent.findBy('studant_id', data.id);
						if (profStudent.professor_id != prof.id) {
							//Check if this prof has more than 20 active studants
							let checkProfStudent = await ProfStudent.findBy('professor_id', profStudent.professor_id);
							checkProfStudent = conv(checkProfStudent);
							if (checkProfStudent.length >= 20) {
								return response.status(200).json({message:"Professor já tem 20 alunos vinculados"});
							}

							//Excluir registro de profStudant do aluno
							profStudent.delete();
							//add registro com o novo professor, mas status 0 e o status do estudante volta pro 0
							await ProfStudent.create({professor_id:prof.id, studant_id:data.id, status:0});
							await User.query().where('id', data.id).update({status:0, confirm:0, confirm_email:0});

							data.confirm 		= 0;
							data.confirm_email 	= 0;
							data.status 		= 0;
						}
					}

					//Caso ative ou desative o DRX ou FRX do professor
					if (level == 'professor' || level == 'administrador' || level == 'operador') {
						let studants_all = await ProfStudent.query().where('professor_id', data.id).fetch()
						if (studants_all == null) {
							if (studants_all.toJSON().length > 0) {
								let studant_id 	= [];
								studants_all 	= conv(studants_all);
								for (let i = 0; i < studants_all.length; i++) {
									studant_id.push(studants_all[i].studant_id)
								}
	
								studant_id = studant_id.join(',')
								await User.query().whereRaw(`id IN (${studant_id})`).update({frx_permission:data.frx_permission, drx_permission:data.drx_permission})
							}
						}
					}
				}
				

				try {
					await User.query().where('id', data.id).update({...data})
					ac = await Address.findBy('user_id', data.id)
					if (ac == null) {
						await Address.create({ ...address, user_id: data.id })
					}else{
						await Address.query().where('user_id', data.id).update({ ...address })
					}
					return response.status(200).json({
						message: `Edição dos dados realizada com sucesso!`
					})
				} catch (error) {
					console.log(error)
					return response.status(500).json({message: "Algo inesperado aconteceu! Por favor tente novamente mais tarde."});
				}

				break;
			case 'empresa':
				//Check if the cnpj exist and if is bond
				try {
					const { type_company } = company
					delete company.type_company

					let checkCompany = await Company.query().where('id', company.id).first()
					
					data.access_level = (type_company == 'tecnico') ? 'Técnico' : 'Financeiro'
					await User.query().where('id', data.id).update({...data, access_level_slug: type_company, frx_permission:1 })
					await Company.query().where('id', checkCompany.id).update({...company})
					// await CompanyUser.create({ company_datum_id: company.id, user_id: id })
					return response.status(200).json({message:`Edição dos dados realizada com sucesso!`});

				} catch (error) {
					console.log(error)
					return response.status(500).json({message: "Algo inesperado aconteceu! Por favor tente novamente mais tarde."});
				}
				
				break;
			default:
				try {
					await User.query().where('id', data.id).update({...data })
					ac = await Address.findBy('user_id', data.id)
					if (ac == null) {
						await Address.create({ ...address, user_id: data.id })
					}else{
						await Address.query().where('user_id', data.id).update({ ...address })
					}
					return response.status(200).json({message:`Edição dos dados realizada com sucesso!` });
				} catch (error) {
					console.log(error)
					return response.status(500).json({message: "Algo inesperado aconteceu! Por favor tente novamente mais tarde."});
				}
			break;
		}
	}

	async confirm({request, response, view}){
		//Confirm email after register
		let {email} = request.all();
		let buff = new Buffer(email, 'base64');
    	email = buff.toString('ascii');
    	
    	await User.query().where('email', email).update({confirm_email:1});
    	
    	return view.render('message', {message:"Email confirmado com sucesso", error:false});
	}

	async confirm_user({request, response, view}){
		let {email, confirm} = request.all();
		let buff = new Buffer(email, 'base64');
    	email = buff.toString('ascii');
    	
    	if (confirm == "true") {
    		await User.query().where('email', email).update({confirm:1, status:1});
    		Mail.send('emails.accessReleased', {email}, (message) => {
	          message
	              .to(email)
	              .from('<from-email>')
	              .subject('SLRX - UFC | Liberação de Acesso')
	        });
    		return view.render('message', {message:"Liberação efetuada com sucesso", error:false});
    	}else{
    		await User.query().where('email', email).update({confirm:0});
    		Mail.send('emails.accessDenied', {email}, (message) => {
	          message
	              .to(email)
	              .from('<from-email>')
	              .subject('SLRX - UFC | Liberação de Acesso')
	        });
    		return view.render('message', {message:"Cadastro recusado", error:false});
    	}
	}

	async confirm_bond({request, response, view}){
		let {email, email_leader} = request.all();
		let buff1 	= new Buffer(email, 'base64');
		let buff2 	= new Buffer(email_leader, 'base64');
    	email 		= buff1.toString('ascii');
    	email_leader= buff2.toString('ascii');
    	
    	const studant= await User.findBy({email:email});
    	const prof 	 = await User.findBy({email:email_leader});

    	//If exist
    	if (studant == null || prof == null) {
    		return response.status(200).json({message:"Aluno ou Professor não existe(m)", error:true});
    	}

    	//If already exist in pivotTable
    	let prof_st = await ProfStudent.query().where({professor_id:prof.id, studant_id:studant.id}).first();

    	if (prof_st.status == 1) {
    		return view.render('message', {message:"Aluno e Professor já vinculados", error:true});
    	}

    	//Atualizar vinculo
    	await ProfStudent.query().where('id', prof_st.id).update({status:1});

    	//Atualizar campo confirm
    	await User.query().where('id', studant.id).update({confirm:1, status:1, confirm_email:1});

    	//Enviar email avisando do seu cadastro
    	Mail.send('emails.accessReleased', {email}, (message) => {
          message
              .to(email)
              .from('<from-email>')
              .subject('SLRX - UFC | Liberação de Acesso')
        });
    	return view.render('message', {message:"Vínculo efetuado com sucesso!", error:false});
	}

	async request_newpass({ request, response }){
		const { email } = request.all()

		let user = await User.findBy('email', email);
		if(user == null){
				return response.status(403).json({"message":"Usuário não encontrado."});
		}
		
		try{
			const key   = await Hash.make(`${email}-${Math.random()*10000}`);
			await RequestPass.create({ user_id:user.id, key });
			return response.status(200).json({"message":"Um chave de acesso foi enviada para seu email. Por favor verifique sua caixa de entrada e recupere sua senha." });
		}catch(e){
			console.log(e) 
			return response.status(500).json({"message":"Algo de errado aconteceu com nosso servidor, por favor tente novamente mais tarde" })
		}
  }

  async set_newpass({request, response}){
		const {token, password}  = request.all();

		const data = {password};
		const req = await RequestPass.findBy('key', token);

		if (req == null) {
			return response.status(403).json({"message":"Chave de acesso não foi encontrada. Tente a recuperação de senha novamente."})            
		}

		//Comparar as datas
		const currentDate   = new Date();
		const rowDate       = new Date(req.created_at);
		let dif             = currentDate - rowDate;
				dif             = Math.floor(dif/(1000*60*60));

		if (dif >= 2) {
			return response.status(403).json({ "message":"Chave de acesso está fora do prazo permitido" });         
		}
		
		try {
			const user = await User.findBy('id', req.user_id);
			user.merge(data);
			await user.save();
	
			await req.delete();
			return response.status(200).json({"message":"Sua senha foi alterada com sucesso!" });
			
		} catch (error) {	
			console.log(error)
			return response.status(500).json({"message":"Algo de errado aconteceu com nosso servidor, por favor tente novamente mais tarde" })
		}
  }

  async change_pass({ request, auth, response }) {

    const user = await User.findBy('id', auth.user.id);
		const userPass = user.password;
		
		const { current_password, password } = request.all();
		
		const verifyPassword = await Hash.verify(
				current_password,
				userPass
		)

		if (!verifyPassword) {
			return response.status(403).json({"message": 'Senha atual invalida'});
		}

		try {
			user.password = password;
			await user.save();
	
			return response.status(200).json({"message":"Senha alterada com suecsso!"});
		} catch (error) {
			console.log(error)
			return response.status(500).json({"message":"Algo de errado aconteceu com nosso servidor, por favor tente novamente mais tarde" })
		}
	}
	
	
	async delete({ request, auth, response }) {
		const {id} = request.all();
		if (auth.user.access_level_slug != 'administrador' && auth.user.access_level_slug != 'operador' && auth.user.access_level_slug != 'professor') {
			return response.status(200).json({message:"Usuário não autorizado", error:true});			
		}
		await User.query().where('id', id).update({status:0});
		await ProfStudent.query().where('studant_id', id).update({status:0});	
		//Desativar todos os alunos	
		return response.status(200).json({message:"Usuário desativado com sucesso", error:false});
	}

  async delete_all({ request, auth, response }) {
		const {array} = request.all();
		if (auth.user.access_level_slug != 'administrador' && auth.user.access_level_slug != 'operador' && auth.user.access_level_slug != 'professor') {
			return response.status(200).json({message:"Usuário não autorizado", error:true});			
		}
		// const sol = await Promise.all(array.map(async id => {
		await Promise.all(array.map(async id => {
			await User.query().where('id', id).update({status:0});
			await ProfStudent.query().where('studant_id', id).orWhere('professor_id', id).update({status:0});	
		}))
		return response.status(200).json({message:"Usuário desativado com sucesso", error:false});

	}
}

module.exports = UserController
