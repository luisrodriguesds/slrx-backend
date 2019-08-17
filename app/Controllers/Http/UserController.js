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

	async index({request}){

	}

	async token({auth}){
        const user = await User.findBy('id', auth.user.id);
        await user.load('address');
        await user.load('academic');
        await user.load('company');
        return user;
    }

	async authentication({request, response, auth}){
        const {email, password} = request.all();
        const token = await auth.attempt(email, password);
        //Check conform and email confirm
        let user = await User.findBy('email', email);
        	user = JSON.parse(JSON.stringify(user)); //O resultado vido de finBy traz um objeto muito maior do que, então se usa essa conversao para que se traga somente os campos
        if (user.confirm == 0) {
	    	return response.status(406).json({message:"Responsável pelo Laboratório ainda não aprovou a liberação de seu acesso, entre em contato."}); 
        }else if (user.confirm_email == 0) {
	    	return response.status(406).json({message:"Email ainda não foi confirmado. Acesse seu conta e libere seu cadastro."}); 
        }else if (user.status == 0) {
	    	return response.status(406).json({message:"Essa conta foi desativada. Entre em contato com o responsável pelo Laboratório."}); 
        }
        return token;
    }

    async logout({auth}){
        await auth.logout()
        return true;
    }

	async create({request, response}){
		//get data
		let academy,academyCreate,id,linkConfirm,linkNoConfirm,buff,buff2,linkBond, email_responsable, user, userAddress;
		const data = request.only(['name','email', 'password', 'access_level_slug', 'cpf', 'birthday', 'sex', 'state', 'city', 'phone1']);
		const {other_email=null, phone2=null} =request.all();
		const access = ['aluno', 'professor', 'empresa', 'operador', 'autonimo'];
			  email_responsable = Env.get('MAIL_RESPONSIBLE'); 
		
		//Rules
		let rules = {
		  name:'required|min:3',
	      email: 'required|email|unique:users,email',
	      password: 'required|min:8',
	      access_level_slug:'in:aluno,professor,empresa,operador,autonimo',
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
	    	return response.status(406).json(validation.messages());
	    }

	    //Switch
	    switch(data.access_level_slug){
	    	case "aluno":
	    		//waiting for: ies,department,title,laboratory,research,description
	    		academy = request.only(['ies','department','title','laboratory','research','description']);
	    		rules = {
	    			ies:'required',
	    			department:'required',
	    			title:'in:Graduando,Graduado,Especializando,Especialista,Mestrando,Mestre,Doutorando,Doutor',
	    			laboratory:'required',
	    			research:'required',
	    			description:'required'
	    		}

	    		validation = await validate(academy, rules);
			    if (validation.fails()) {
			    	return response.status(406).json(validation.messages());
			    }
			    
			    //Check if the professor is registered
				let {email_leader} 	= request.all(); 
				let email_prof		= await User.findBy({email:email_leader, access_level_slug:"professor", confirm:1});
				if (email_prof == null) {
			    	return response.status(406).json({message:"Esse professor/orientador não tem cadastro válido com o email informado. Por favor, digite um email de orientador de uma conta válida.", error:true});
				}

			    try{

			    	//Create at database
				    let {id} = await User.create({...data, other_email, phone2, access_level:"Aluno"});
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
				    //Return 
				    return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. <br> Além disso, foi enviado um email para ${email_leader}, seu orientador, solicitando que ele confirme seu vinculo para que possa cadastrar suas amostras no sistema.`, error:false});

			    }catch(e){
			    	console.log(e);
			    	return response.status(500).json({message:"Ocorreu algum erro, tente novamente mais tarde", error:true});
			    }
	    	break;
	    	case "professor":
	    		//waiting for: ies,department,title,laboratory,research,description
	    		academy = request.only(['ies','department','title','laboratory','research','description']);
	    		rules = {
	    			ies:'required',
	    			department:'required',
	    			title:'in:Graduando,Graduado,Especializando,Especialista,Mestrando,Mestre,Doutorando,Doutor',
	    			laboratory:'required',
	    			research:'required',
	    			description:'required'
	    		}

	    		validation = await validate(academy, rules);
			    if (validation.fails()) {
			    	return response.status(406).json(validation.messages());
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
			    	return response.status(500).json({message:"Ocorreu algum erro, tente novamente mais tarde", erro:true});
			    }
	    	break;
	    	case "empresa":
	    		//waiting for: cnpj,fantasy_name,company_name,state_registration,email,fone,cep,street,neighborhood,number,city,state
	    		let company = request.only(['cnpj','fantasy_name','company_name','state_registration','email_company','fone','cep','street','neighborhood','number','city','state']);
				let {type_company} = request.all();
				rules = {
	    			cnpj:'required|min:18|max:18',
	    			fantasy_name:'required',
	    			company_name:'required',
	    			state_registration:'required',
	    			email_company:'required',
	    			fone:'required',
	    			cep:'required',
	    			street:'required',
	    			neighborhood:'required',
	    			number:'required',
	    			city:'required',
					state:'required'
	    		}
	    		validation = await validate(company, rules);
			    if (validation.fails()) {
			    	return response.status(406).json(validation.messages());
				}

				if(type_company != 'tecnico' && type_company != 'financeiro'){
					return response.status(406).json({message:"Tipo de usuário de empresa deve ser Técnico ou Financeiro"});
				}else{
					data.access_level = (type_company == 'tecnico') ? 'Técnico' : 'Financeiro';
					data.access_level_slug = type_company;
				}
	    		//Check if the cnpj exist and if is bond
	    		let checkCompany = await Company.findBy({cnpj:company.cnpj});
	    		if (checkCompany == null) {
	    			company 		= await Company.create({...company});
				    const user 		= await User.create({...data, other_email, phone2});
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
				    email_responsable 	= Env.get('MAIL_RESPONSIBLE'); 
				   	linkConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
				    linkNoConfirm 		= `${Env.get('APP_URL')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
				    await Mail.send('emails.companyConfirm', {linkConfirm,linkNoConfirm, company,...data}, (message) => {
			          message
			              .to(email_responsable)
			              .from('<from-email>')
			              .subject('SLRX - UFC | Confirmação de Cadastro de Empresa')
			        });
				    return response.status(200).json({message:`Seu cadastro foi efetuado com sucesso! Um email de confirmação foi enviado para ${data.email}. Acesse seu email e finalize seu cadastro. <br> Além disso, foi enviado um email para o responsável pelo labratório para que seja liberado seu acesso. Logo logo você receberá um email avisando a liberação do seu cadastro.`, error:false});
					
				}
				
				company 		= checkCompany;
				user 			= await User.create({...data, other_email, phone2});
				const comUser 	= await CompanyUser.create({company_id:company.id, user_id:user.id});
				
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
			    	return response.status(406).json(validation.messages());
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
	    	case "autonimo":
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
			    	return response.status(406).json(validation.messages());
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

	async confirm({request, response}){
		//Confirm email after register
		let {email} = request.all();
		let buff = new Buffer(email, 'base64');
    	email = buff.toString('ascii');
    	
    	await User.query().where('email', email).update({confirm_email:1});
		
		return response.status(200).json({message:"Email confirmado com sucesso"});
	}

	async confirm_user({request, response}){
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
	        return response.status(200).json({message:"Liberação efetuada com sucesso"});
    	}else{
    		await User.query().where('email', email).update({confirm:0});
    		await Mail.send('emails.accessDenied', {email}, (message) => {
	          message
	              .to(email)
	              .from('<from-email>')
	              .subject('SLRX - UFC | Liberação de Acesso')
	        });
	        return response.status(200).json({message:"Cadastro recusado"});

    	}
	}

	async confirm_bond({request, response}){
		let {email, email_leader} = request.all();
		let buff1 	= new Buffer(email, 'base64');
		let buff2 	= new Buffer(email_leader, 'base64');
    	email 		= buff1.toString('ascii');
    	email_leader= buff2.toString('ascii');
    	
    	const studant= await User.findBy({email:email});
    	const prof 	 = await User.findBy({email:email_leader});

    	//If exist
    	if (studant == null || prof == null) {
    		return response.status(406).json({message:"Aluno ou Professor não existe(m)"});
    	}

    	//If already exist in pivotTable
    	const prof_st = await ProfStudent.findBy({professor_id:prof.id, studant_id:studant.id});
    	if (prof_st != null) {
    		return response.status(406).json({message:"Aluno e Professor já vinculados"});
    	}

    	//Cria vinculo
    	const confirm_bond = await ProfStudent.create({professor_id:prof.id, studant_id:studant.id});

    	//Atualizar campo confirm
    	await User.query().where('id', studant.id).update({confirm:1});

    	//Enviar email avisando do seu cadastro
    	await Mail.send('emails.accessReleased', {email}, (message) => {
          message
              .to(email)
              .from('<from-email>')
              .subject('SLRX - UFC | Liberação de Acesso')
        });

    	return response.status(200).json({message:"Vínculo efetuado com sucesso!"});
	}

	async request_newpass({params, response}){
        const email = (params.email == undefined) ? 0 : params.email;
        let   user  = await User.findBy('email', email);
        const key   = await Hash.make(`${email}-${Math.random()*10000}`);
        
        if(user == null){
            return response.status(406).json({"message":"Usuário não encontrado."})
        }
        user = JSON.parse(JSON.stringify(user));

        const link = `${Env.get('LINK_SET_NEW_PASS')}?token=${key}`;

        await Mail.send('emails.requestNewpass', {...user, link}, (message) => {
            message
                .to(email)
                .from('<from-email>')
                .subject('SLRX - UFC | Recuperação de Senha')
            })
        
        await RequestPass.create({user_id:user.id, key});
        return key;
    }

    async set_newpass({request, response}){
        const {token, password}  = request.only(['token', 'password']);
        const data = {password};
        const req = await RequestPass.findBy('key', token);

        if (req == null) {
            return response.status(406).json({"message":"Chave de acesso não foi encontrada. Tente a recuperação de senha novamente."})            
        }

        //Comparar as datas
        const currentDate   = new Date();
        const rowDate       = new Date(req.created_at);
        let dif             = currentDate - rowDate;
            dif             = Math.floor(dif/(1000*60*60));

        if (dif >= 2) {
            return response.status(406).json({"message":"Invalid token"})         
        }
        // console.log(req.user_id);
        const user = await User.findBy('id', req.user_id);
        user.merge(data);
        await user.save();

        //apagar token
        await req.delete();
        return user;
    }

    async change_newpass({ request, params, response }) {
        // get currently authenticated user
        const user = await User.findBy('id', params.id);
        
        // verify if current password matches
        const verifyPassword = await Hash.verify(
            request.input('password'),
            user.password
        )
        
        // display appropriate message
        if (!verifyPassword) {
            return response.status(400).json({"message": 'As senhas não correspondem, por favor tente novamente.'});
        }
    
        // hash and save new password
        user.password = request.input('newPassword')
        await user.save()
    
        return response.status(406).json({"message":"Senha alterada com suecsso!"});
    }
}

module.exports = UserController
