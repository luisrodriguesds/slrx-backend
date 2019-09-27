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

class UserController {

	async index({request, auth}){
    	const {page=1, perPage=10} = request.all();
		let user;
		switch(auth.user.access_level_slug){
			case "operador":
			case "administrador":
				user = await User.query().where('id', '!=', '1').orderBy('created_at', 'desc').paginate(page, perPage);
		        return user;
			break;
			case "professor":

			break;
		}
	}

	async show({request, auth}){
		const {id} = request.all();
		let user;
		switch(auth.user.access_level_slug){
			case "operador":
			case "administrador":
				user = await User.findBy('id', id);
		        return user;
			break;
			case "professor":

			break;
		}
	}

	async token({response, auth}){
		try {
			await auth.check();
		} catch (error) {
			return response.status(200).json({message:"Usuário não está logado", error:true});
		}

        const user = await User.findBy('id', auth.user.id);
        await user.load('address');
        await user.load('academic');
        await user.load('company');
        return response.status(200).json({user, error:false});
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
        	user = JSON.parse(JSON.stringify(user)); //O resultado vido de finBy traz um objeto muito maior do que, então se usa essa conversao para que se traga somente os campos
        if(user == null){
	    	return response.status(200).json({message:"Usuário não encontrado", error:true}); 			
		}else if (user.confirm == 0) {
	    	return response.status(200).json({message:"Responsável pelo Laboratório ainda não aprovou a liberação de seu acesso, entre em contato.", error:true}); 
        }else if (user.confirm_email == 0) {
	    	return response.status(200).json({message:"Email ainda não foi confirmado. Acesse sua caixa de entrada e libere seu cadastro.", error:true}); 
        }else if (user.status == 0) {
	    	return response.status(200).json({message:"Essa conta foi desativada. Entre em contato com o responsável pelo Laboratório.", error:true}); 
		}

		try {
			const token = await auth.attempt(email, password);
			return token;
		} catch (error) {
	    	return response.status(200).json({message:"Senha incorreta! Tente novamente ou clique em esqueci minha senha!", error:true}); 			
		}
    }

    async logout({auth }) { 
	  await auth.check()
	  const token = auth.getAuthHeader()
      return await auth.revokeTokens([token]);
  	}

	async filter({request, response, auth}){
		const {filter, page=1, perPage=50} = request.all();

		switch(auth.user.access_level_slug){
			case "operador":
			case "administrador":
				const user = await User.query().where('id', '!=', '1').andWhere('name', 'like', `%${filter}%`).orderBy('created_at', 'desc').paginate(page, perPage);
		        return user;
			break;
			case "professor":

			break;
		}

  	}

  	async filterby({request}){
		const {filter, page=1, perPage=50} = request.all();
		let users;
		switch(filter){
			case "Filtro":
				users = await User.query().where('id', '!=', '1').orderBy('created_at', 'desc').paginate(page, perPage);
			break;
			case "Professores":
				users = await User.query().where('access_level_slug', '=', 'professor').orderBy('created_at', 'desc').paginate(page, perPage);
			break;
			case "Alunos":
				users = await User.query().where('access_level_slug', '=', 'aluno').orderBy('created_at', 'desc').paginate(page, perPage);
			break;
			case "Operadores":
				users = await User.query().where('access_level_slug', '=', 'operador').orderBy('created_at', 'desc').paginate(page, perPage);
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
				users = await User.query().where('status', '=', '0').orderBy('created_at', 'desc').paginate(page, perPage);
			break;
		}

		return users;
  	}

	async create({request, response}){
		//get data
		let academy,academyCreate,id,linkConfirm,linkNoConfirm,buff,buff2,linkBond, email_responsable, user, userAddress;
		const data = request.only(['name','email', 'password', 'access_level_slug', 'cpf', 'birthday', 'sex', 'state', 'city', 'phone1']);
		const {other_email=null, phone2=null} =request.all();
		const access = ['aluno', 'professor', 'empresa', 'operador', 'autonomo'];
			  email_responsable = Env.get('MAIL_RESPONSIBLE'); 
		
		//Rules
		let rules = {
		  name:'required|min:3',
	      email: 'required|email|unique:users,email',
	      password: 'required|min:8',
	      access_level_slug:'in:aluno,professor,empresa,operador,autonomo',
	      cpf:'required|min:14|max:14',
	      birthday:'date',
	      sex:'required|min:1|max:2',
	      state:'required',
	      city:'required',
	      phone1:'required'
	    }

	    //Validation
	    let validation = await validate(data, rules);
	    if (validation.fails()) {
	    	return response.status(200).json({...validation.messages()[0], error:true});
	    }

	    //Switch
	    switch(data.access_level_slug){
	    	case "aluno":
	    		//waiting for: ies,department,title,laboratory,research,description
	    		academy = request.only(['ies','department','title','laboratory','research','description']);
	    		rules = {
	    			ies:'required',
	    			department:'required',
	    			title:'required|in:Graduando,Graduado,Especializando,Especialista,Mestrando,Mestre,Doutorando,Doutor',
	    			laboratory:'required',
	    			research:'required',
	    			description:'required'
	    		}

	    		validation = await validate(academy, rules);
			    if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
			    }
			    
			    //Check if the professor is registered and if he has more than 20 studant registed
				let {email_leader} 	= request.all(); 
				let email_prof		= await User.findBy({email:email_leader, access_level_slug:"professor", confirm:1});
				if (email_prof == null) {
			    	return response.status(200).json({message:"Esse professor/orientador não tem cadastro válido com o email informado. Por favor, digite um email de orientador de uma conta válida.", error:true});
				}else{
					email_prof = JSON.parse(JSON.stringify(email_prof));
					let count_studant = await ProfStudent.query().where({professor_id:email_prof.id, status:1}).fetch();
					count_studant = JSON.parse(JSON.stringify(count_studant));
					
					if (count_studant.length >= 20) {
			    		return response.status(200).json({message:"Esse professor/orientador já excedeu o limite de 20 alunos ativos.", error:true});
					}

				}

			    try{

			    	//Create at database
				    let {id} = await User.create({...data, other_email, phone2, access_level:"Aluno"});
				    academyCreate = await Academy.create({...academy, user_id:id});
				    let profStudent = await ProfStudent.create({professor_id:email_prof.id, studant_id:id, status:0});
				    
				     //send the emails
				     //confirm register in email
				    buff = new Buffer(data.email); 
				    linkConfirm =  `${Env.get('APP_URL')}/api/user/confirm?email=${buff.toString('base64')}`;
				    await Mail.send('emails.confirmEmail', {...data, linkConfirm}, (message) => {
			          message
			              .to(data.email)
			              .from('<from-email>')
			              .subject('SLRX - UFC | Confirmação de Cadastro')
			          });

				    //Professor confirm studant
				    let {email_leader} = request.all(); 
				    buff2 = new Buffer(email_leader);
				    linkBond = `${Env.get('APP_URL')}/api/user/confirm-bond?email=${buff.toString('base64')}&&email_leader=${buff2.toString('base64')}`
				    await Mail.send('emails.professorConfirmStudant', {linkBond, email_leader, email:data.email, name:data.name}, (message) => {
			          message
			              .to(email_leader)
			              .from('<from-email>')
			              .subject('SLRX - UFC | Confirmação de Vínculo')
			        });

				    return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. <br> Além disso, foi enviado um email para ${email_leader}, seu orientador, solicitando que ele confirme seu vinculo para que possa cadastrar suas amostras no sistema.`, error:false});

			    }catch(e){
			    	console.log(e);
			    	return response.status(200).json({message:"Ocorreu algum erro, tente novamente mais tarde", error:true});
			    }

	    	break;
	    	case "professor":
	    		//waiting for: ies,department,title,laboratory,research,description
	    		academy = request.only(['ies','department','title','laboratory','research','description']);
	    		rules = {
	    			ies:'required',
	    			department:'required',
	    			title:'required|in:Graduando,Graduado,Especializando,Especialista,Mestrando,Mestre,Doutorando,Doutor',
	    			laboratory:'required',
	    			research:'required',
	    			description:'required'
	    		}

	    		validation = await validate(academy, rules);
			    if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
			    }

			    try{
			    	//Create at database
				    let {id} = await User.create({...data, other_email, phone2, access_level:"Professor"});
				    academyCreate = await Academy.create({...academy, user_id:id});
				    
				     //send the emails
				     //confirm register in email
				    buff = new Buffer(data.email); 
				    linkConfirm =  `${Env.get('APP_URL')}/api/user/confirm?email=${buff.toString('base64')}`;
				    await Mail.send('emails.confirmEmail', {...data, linkConfirm}, (message) => {
			          message
			              .to(data.email)
			              .from('<from-email>')
			              .subject('SLRX - UFC | Confirmação de Cadastro')
			          });

				    //Sasaki confirm professor
				   	linkConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
				    linkNoConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
				    await Mail.send('emails.professorConfirm', {linkConfirm,linkNoConfirm, email:data.email, name:data.name, ...academy}, (message) => {
			          message
			              .to(email_responsable)
			              .from('<from-email>')
			              .subject('SLRX - UFC | Confirmação de Cadastro de Professor')
			        });
				    //Return 
				    return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. <br> Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação do seu cadastro.`, error:false});

			    }catch(e){
			    	console.log(e);
			    	return response.status(500).json({message:"Ocorreu algum erro, tente novamente mais tarde", error:true});
			    }
	    	break;
	    	case "empresa":
	    		//waiting for: cnpj,fantasy_name,company_name,state_registration,email,fone,cep,street,neighborhood,number,city,state
	    		let company = request.only(['cnpj','fantasy_name','company_name','state_registration','company_email','company_phone','cep','street','neighborhood','number','company_city','company_state']);
				let {type_company} = request.all();
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
					company_state:'required'
	    		}
	    		validation = await validate(company, rules);
			    if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
				}

				if(type_company != 'tecnico' && type_company != 'financeiro'){
					return response.status(200).json({message:"Tipo de usuário de empresa deve ser Técnico ou Financeiro", error:true});
				}else{
					data.access_level = (type_company == 'tecnico') ? 'Técnico' : 'Financeiro';
					data.access_level_slug = type_company;
				}
	    		//Check if the cnpj exist and if is bond
	    		let checkCompany = await Company.findBy({cnpj:company.cnpj});
	    		if (checkCompany == null) {
	    			company 		= await Company.create({...company});   
				}else{
					checkCompany = JSON.parse(JSON.stringify(checkCompany));
					company 		= checkCompany;
				}

				user 			= await User.create({...data, other_email, phone2});
				const comUser 	= await CompanyUser.create({company_datum_id:company.id, user_id:user.id});
				
				//send the emails
				//confirm register in email
				buff = new Buffer(data.email); 
				linkConfirm =  `${Env.get('APP_URL')}/api/user/confirm?email=${buff.toString('base64')}`;
				await Mail.send('emails.confirmEmail', {...data, linkConfirm}, (message) => {
				message
					.to(data.email)
					.from('<from-email>')
					.subject('SLRX - UFC | Confirmação de Cadastro')
				});

				//Sasaki confirm professor
				linkConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
				linkNoConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
				await Mail.send('emails.companyConfirm', {linkConfirm,linkNoConfirm, company,...data}, (message) => {
					message
						.to(email_responsable)
						.from('<from-email>')
						.subject('SLRX - UFC | Confirmação de Cadastro de Empresa')
				});

				return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. <br> Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação do seu cadastro.`, error:false});

	    	break;
	    	case "operador":
	    		//waiting for: cep_address,street_address,neighborhood_address,number_address,city_address,state_address
				let operator = request.only(['cep_address','street_address','neighborhood_address','number_address','city_address','state_address']);
				rules = {
	    			cep_address:'required',
					street_address:'required',
					neighborhood_address:'required',
					number_address:'required',
					city_address:'required',
					state_address:'required'
	    		}

	    		validation = await validate(operator, rules);
	    		if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
				}

					  user = await User.create({...data, other_email, phone2, access_level:"Operador"});
				userAddress = await Address.create({...operator, user_id:user.id, status:1});

				//send the emails
				//confirm register in email
				buff = new Buffer(data.email); 
				linkConfirm =  `${Env.get('APP_URL')}/api/user/confirm?email=${buff.toString('base64')}`;
				await Mail.send('emails.confirmEmail', {...data, linkConfirm}, (message) => {
				message
					.to(data.email)
					.from('<from-email>')
					.subject('SLRX - UFC | Confirmação de Cadastro')
				});

				//Sasaki confirm professor
				linkConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
				linkNoConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
				await Mail.send('emails.operatorConfirm', {linkConfirm,linkNoConfirm, ...data}, (message) => {
					message
						.to(email_responsable)
						.from('<from-email>')
						.subject('SLRX - UFC | Confirmação de Cadastro de Operador')
				});

				return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. <br> Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação do seu cadastro.`, error:false});
				
	    	break;
	    	case "autonomo":
	    		//waiting for: nothing more
	    		let freelance = request.only(['cep_address','street_address','neighborhood_address','number_address','city_address','state_address']);
				rules = {
	    			cep_address:'required',
					street_address:'required',
					neighborhood_address:'required',
					number_address:'required',
					city_address:'required',
					state_address:'required'
	    		}

	    		validation = await validate(freelance, rules);
	    		if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
				}

					  user = await User.create({...data, other_email, phone2, access_level:"Autônomo"});
				userAddress = await Address.create({...freelance, user_id:user.id, status:1});

				//send the emails
				//confirm register in email
				buff = new Buffer(data.email); 
				linkConfirm =  `${Env.get('APP_URL')}/api/user/confirm?email=${buff.toString('base64')}`;
				await Mail.send('emails.confirmEmail', {...data, linkConfirm}, (message) => {
				message
					.to(data.email)
					.from('<from-email>')
					.subject('SLRX - UFC | Confirmação de Cadastro')
				});

				//Sasaki confirm professor
				linkConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
				linkNoConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
				await Mail.send('emails.freelanceConfirm', {linkConfirm,linkNoConfirm, ...data}, (message) => {
					message
						.to(email_responsable)
						.from('<from-email>')
						.subject('SLRX - UFC | Confirmação de Cadastro de Autônomo')
				});

				return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. <br> Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação do seu cadastro.`, error:false});
	    	break;
	    }
	}

	async update({request, response, auth}){
		//get data
		let academy;
		const data = request.only(['name','email','birthday','sex','other_email','state','city','phone1', 'phone2'])
		const {other_email=null, phone2=null, user_id=null, access_level_slug=null} =request.all();
		const access = ['aluno', 'professor', 'financeiro', 'tecnico', 'operador', 'autonomo', 'administrador'];
		
		//Middleware	
		if (auth.user.id != user_id && auth.user.access_level_slug != 'administrador') {
			return response.status(200).json({message:"Usuário não autorizado", error:true});			
		}

		//validation
		//Rules
		let rules = {
			name:'required|min:3',
			email: 'required|email',
			access_level_slug:'in:aluno,professor,financeiro,tecnico,operador,autonomo,administrador',
			birthday:'date',
			sex:'required|min:1|max:2',
			state:'required',
			city:'required',
			phone1:'required'
		}

		//Validation
		let validation = await validate(data, rules);
		if (validation.fails()) {
			return response.status(200).json({...validation.messages()[0], error:true});
		}

		//Check access
		let type = '';
		if (access_level_slug == 'aluno' || access_level_slug == 'professor') {
			type = 'academic';
		}else if (access_level_slug == 'financeiro' || access_level_slug == 'tecnico') {
			type = 'company';			
		}else{
			type = 'others';			
		}

		switch (type) {
			case 'academic':
				academy = request.only(['ies','department','title','laboratory','research','description']);
				rules = {
	    			ies:'required',
	    			department:'required',
	    			title:'required|in:Graduando,Graduado,Especializando,Especialista,Mestrando,Mestre,Doutorando,Doutor',
	    			laboratory:'required',
	    			research:'required',
	    			description:'required'
	    		}

	    		validation = await validate(academy, rules);
			    if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
				}

				await User.query().where('id', user_id).update({...data, other_email, phone2});
				await Academy.query().where('user_id', user_id).update({...academy}); //Verifiar se existe esse dado
				return response.status(200).json({message:"Dados alterados com sucesso!", error:false});				
			break;
			case 'company':
				let company = request.only(['cnpj','fantasy_name','company_name','state_registration','company_email','company_phone','cep','street','neighborhood','number','company_city','company_state']);
				let {type_company, company_id} = request.all();
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
					company_state:'required'
	    		}
	    		validation = await validate(company, rules);
			    if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
				}

				if(type_company != 'tecnico' && type_company != 'financeiro'){
					return response.status(200).json({message:"Tipo de usuário de empresa deve ser Técnico ou Financeiro", error:true});
				}
				
				data.access_level = (type_company == 'tecnico') ? 'Técnico' : 'Financeiro';
				data.access_level_slug = type_company;

				await User.query().where('id', user_id).update({...data, other_email, phone2});
				await Company.query().where('id', company_id).update({...company}); //Verificar se existe esse dado na tabela
				return response.status(200).json({message:"Dados alterados com sucesso!", error:false});				
			break;
			case 'others':
				let other = request.only(['cep_address','street_address','neighborhood_address','number_address','city_address','state_address']);
				let {address_id} = request.all();
				rules = {
	    			cep_address:'required',
					street_address:'required',
					neighborhood_address:'required',
					number_address:'required',
					city_address:'required',
					state_address:'required'
	    		}

	    		validation = await validate(other, rules);
	    		if (validation.fails()) {
			    	return response.status(200).json({...validation.messages()[0], error:true});
				}

				await User.query().where('id', user_id).update({...data, other_email, phone2});
				await Address.query().where('id', address_id).update({...other});
				return response.status(200).json({message:"Dados alterados com sucesso!", error:false});				

			break;
			default:
				return response.status(200).json({message:"Tipo de usuário não encontrado", error:true});
			break;
		}
		return 0;
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
    		await User.query().where('email', email).update({confirm:1});
    		await Mail.send('emails.accessReleased', {email}, (message) => {
	          message
	              .to(email)
	              .from('<from-email>')
	              .subject('SLRX - UFC | Liberação de Acesso')
	        });
    		return view.render('message', {message:"Liberação efetuada com sucesso", error:false});
    	}else{
    		await User.query().where('email', email).update({confirm:0});
    		await Mail.send('emails.accessDenied', {email}, (message) => {
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
    	let prof_st = await ProfStudent.query().where({professor_id:prof.id, studant_id:studant.id}).fetch();
    	prof_st = JSON.parse(JSON.stringify(prof_st))[0];

    	if (prof_st.status == 1) {
    		return view.render('message', {message:"Aluno e Professor já vinculados", error:true});
    	}

    	//Atualizar vinculo
    	await ProfStudent.query().where('id', prof_st.id).update({status:1});

    	//Atualizar campo confirm
    	await User.query().where('id', studant.id).update({confirm:1});

    	//Enviar email avisando do seu cadastro
    	await Mail.send('emails.accessReleased', {email}, (message) => {
          message
              .to(email)
              .from('<from-email>')
              .subject('SLRX - UFC | Liberação de Acesso')
        });
    	return view.render('message', {message:"Vínculo efetuado com sucesso!", error:false});
	}

	async request_newpass({params, response}){
		const email = (params.email == undefined) ? 0 : params.email;
		const rules = {
			email:'required|email'
		}
		//Validation
		let validation = await validate({email}, rules);
		if (validation.fails()) {
			return response.status(200).json({...validation.messages()[0], error:true});
		}

        let   user  = await User.findBy('email', email);
        if(user == null){
            return response.status(200).json({"message":"Usuário não encontrado.", error:true});
		}
		user = JSON.parse(JSON.stringify(user));
		
        const key   = await Hash.make(`${email}-${Math.random()*10000}`);
        const link = `${Env.get('LINK_SET_NEW_PASS')}?token=${key}`;

        await Mail.send('emails.requestNewpass', {...user, link}, (message) => {
            message
                .to(email)
                .from('<from-email>')
                .subject('SLRX - UFC | Recuperação de Senha')
            })
        
        await RequestPass.create({user_id:user.id, key});
        return response.status(200).json({"message":"Um chave de acesso foi enviada para seu email. Por favor verifique sua caixa de entrada e recupere sua senha.", error:false, key});
    }

    async set_newpass({request, response}){
		const {token, password}  = request.all();
		const rules = {
			password:'required|min:8'
		};

		//Validation
		let validation = await validate({password}, rules);
		if (validation.fails()) {
			return response.status(200).json({...validation.messages()[0], error:true});
		}

		const data = {password};
        const req = await RequestPass.findBy('key', token);

        if (req == null) {
            return response.status(200).json({"message":"Chave de acesso não foi encontrada. Tente a recuperação de senha novamente.", error:true})            
        }

        //Comparar as datas
        const currentDate   = new Date();
        const rowDate       = new Date(req.created_at);
        let dif             = currentDate - rowDate;
            dif             = Math.floor(dif/(1000*60*60));

        if (dif >= 2) {
            return response.status(200).json({"message":"Chave de acesso está fora do prazo permitido", error:true});         
        }
        // console.log(req.user_id);
        const user = await User.findBy('id', req.user_id);
        user.merge(data);
        await user.save();

        //apagar token
        await req.delete();
        return response.status(200).json({"message":"Sua senha foi alterada com sucesso!", error:false});
    }

    async change_pass({ request, auth, response }) {

        // get currently authenticated user
        const user = await User.findBy('id', auth.user.id);
		const userPass = JSON.parse(JSON.stringify(user)).password;
		
		const {current_password, password} = request.all();
        // verify if current password matches
        const verifyPassword = await Hash.verify(
            current_password,
            userPass
        )

        // display appropriate message
        if (!verifyPassword) {
            return response.status(200).json({"message": 'Senha atual invalida', error:true});
        }
    
        // hash and save new password
        user.password = password;
        await user.save();
    
        return response.status(200).json({"message":"Senha alterada com suecsso!", error:false});
    }
}

module.exports = UserController
