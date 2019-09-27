'use strict'

/*
|--------------------------------------------------------------------------
| GlobalSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/
/** @type {import('@adonisjs/lucid/src/Factory')} */
const Hash = use('Hash');
// const Factory = use('Factory');
const Database = use('Database');
const dateformat = use('dateformat');

class GlobalSeeder {
  async run () {
    const datenow = dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

    //User root
    await Database.table('users').insert({
      name:'root',
      email:'root@root.com',
      password: await Hash.make('10050621'),
      access_level:'Administrador',
      access_level_slug:'administrador',
      cpf:'000.000.000-00',
      birthday:datenow,
      sex:1,
      other_email:'',
      state:'CE',
      city:'Fortaleza',
      phone1:'(85997646060)',
      phone2:'',
      confirm:1,
      confirm_email:1,
      created_at:datenow,
      updated_at:datenow,
    });

    // MENUS
    await Database.table('menus').insert([
    /*1*/{ name: 'Dashboard', url: '/dashboard', section:'Dashboard', icon:'fas fa-fire', status:0, created_at:datenow, updated_at:datenow},
    /*2*/{ name: 'Ver Arquivos', url: '/arquivos-uteis', section:'Arquivos Úteis', icon:'fas fa-file-alt', created_at:datenow, updated_at:datenow},
    /*3*/{ name: 'Enviar Arquivo', url: '/arquivos-uteis/enviar', section:'Arquivos Úteis', icon:'fas fa-file-alt', created_at:datenow, updated_at:datenow},
    /*4*/{ name: 'Todos os Equipamentos', url: '/equipamentos', section:'Equipamentos', icon:'fas fa-plug', created_at:datenow, updated_at:datenow},
    /*5*/{ name: 'Cadastrar Equipamento', url: '/equipamentos/cadastro', section:'Equipamentos', icon:'fas fa-plug', created_at:datenow, updated_at:datenow},
    /*6*/{ name: 'Todos os Usuários', url: '/usuarios', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*7*/{ name: 'Cadastrar Usuário', url: '/usuarios/cadastro', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*8*/{ name: 'Todas as Solicitações', url: '/solicitacoes', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
    /*9*/{ name: 'Cadastrar Solicitação', url: '/solicitacoes/cadastro', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
    /*10*/{ name: 'Tutoriais', url: '/solicitacoes/tutoriais', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
    ]);

     // Access Level
     await Database.table('access_levels').insert([
     /*1*/{ name: 'Aluno', name_slug: 'aluno', created_at:datenow, updated_at:datenow},
     /*2*/{ name: 'Professor', name_slug: 'professor', created_at:datenow, updated_at:datenow},
     /*3*/{ name: 'Financeiro', name_slug: 'financeiro', created_at:datenow, updated_at:datenow},
     /*4*/{ name: 'Técnico', name_slug: 'tecnico', created_at:datenow, updated_at:datenow},
     /*5*/{ name: 'Autônomo', name_slug: 'autonomo', created_at:datenow, updated_at:datenow},
     /*6*/{ name: 'Operador', name_slug: 'operador', created_at:datenow, updated_at:datenow},
     /*7*/{ name: 'Administrador', name_slug: 'administrador', created_at:datenow, updated_at:datenow},
     ]);

     //Menu Acess
     await Database.table('menu_accesses').insert([
       //Dashboard
      { menu_id: 1, access_id: 1, created_at:datenow, updated_at:datenow},
      { menu_id: 1, access_id: 2, created_at:datenow, updated_at:datenow},
      { menu_id: 1, access_id: 3, created_at:datenow, updated_at:datenow},
      { menu_id: 1, access_id: 4, created_at:datenow, updated_at:datenow},
      { menu_id: 1, access_id: 5, created_at:datenow, updated_at:datenow},
      { menu_id: 1, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 1, access_id: 7, created_at:datenow, updated_at:datenow},

      //Ver Arquivos
      { menu_id: 2, access_id: 1, created_at:datenow, updated_at:datenow},
      { menu_id: 2, access_id: 2, created_at:datenow, updated_at:datenow},
      { menu_id: 2, access_id: 3, created_at:datenow, updated_at:datenow},
      { menu_id: 2, access_id: 4, created_at:datenow, updated_at:datenow},
      { menu_id: 2, access_id: 5, created_at:datenow, updated_at:datenow},
      { menu_id: 2, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 2, access_id: 7, created_at:datenow, updated_at:datenow},

      //Enviar Arquivo
      { menu_id: 3, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 3, access_id: 7, created_at:datenow, updated_at:datenow},

      //Todos os Equipamentos
      { menu_id: 4, access_id: 1, created_at:datenow, updated_at:datenow},
      { menu_id: 4, access_id: 2, created_at:datenow, updated_at:datenow},
      { menu_id: 4, access_id: 3, created_at:datenow, updated_at:datenow},
      { menu_id: 4, access_id: 4, created_at:datenow, updated_at:datenow},
      { menu_id: 4, access_id: 5, created_at:datenow, updated_at:datenow},
      { menu_id: 4, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 4, access_id: 7, created_at:datenow, updated_at:datenow},

      //Cadastrar Equipamento
      { menu_id: 5, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 5, access_id: 7, created_at:datenow, updated_at:datenow},

      //Todos os Usuários
      { menu_id: 7, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 6, access_id: 7, created_at:datenow, updated_at:datenow},

      //Cadastrar Usuário
      { menu_id: 7, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 7, access_id: 7, created_at:datenow, updated_at:datenow},

      //Todas as Solicitações
      { menu_id: 8, access_id: 1, created_at:datenow, updated_at:datenow},
      { menu_id: 8, access_id: 2, created_at:datenow, updated_at:datenow},
      { menu_id: 8, access_id: 3, created_at:datenow, updated_at:datenow},
      { menu_id: 8, access_id: 4, created_at:datenow, updated_at:datenow},
      { menu_id: 8, access_id: 5, created_at:datenow, updated_at:datenow},
      { menu_id: 8, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 8, access_id: 7, created_at:datenow, updated_at:datenow},
      
      //Cadastrar Solicitação
      { menu_id: 9, access_id: 1, created_at:datenow, updated_at:datenow},
      { menu_id: 9, access_id: 2, created_at:datenow, updated_at:datenow},
      { menu_id: 9, access_id: 3, created_at:datenow, updated_at:datenow},
      { menu_id: 9, access_id: 4, created_at:datenow, updated_at:datenow},
      { menu_id: 9, access_id: 5, created_at:datenow, updated_at:datenow},
      { menu_id: 9, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 9, access_id: 7, created_at:datenow, updated_at:datenow},
      
      //Tutoriais
      { menu_id: 10, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 10, access_id: 7, created_at:datenow, updated_at:datenow},
      

      ]);

      //Valores das fendas
      await Database.table('gaps').insert([
        {name:'3/4', status:1, created_at:datenow, updated_at:datenow},
        {name:'1/2', status:1, created_at:datenow, updated_at:datenow},
        {name:'1/8', status:1, created_at:datenow, updated_at:datenow},
        {name:'1/16', status:1, created_at:datenow, updated_at:datenow},
        {name:'1/4', status:1, created_at:datenow, updated_at:datenow},
        {name:'1/64', status:1, created_at:datenow, updated_at:datenow},
        {name:'1/32', status:1, created_at:datenow, updated_at:datenow},
      ]);    

      //Equipamentos
      await Database.table('equipment').insert([
        {name:'Rigaku DMAXB',type:'DRX',tube:'CU', status:0, created_at:datenow, updated_at:datenow},
        {name:"PANalytical X'Pert PRO",type:'DRX',tube:'CO', status:1, created_at:datenow, updated_at:datenow},
        {name:"Rigaku ZSX mini II",type:'FRX',tube:'CO', status:1, created_at:datenow, updated_at:datenow},
        {name:"PANalytical Axios mAX - IPDI",type:'FRX',tube:'CO', status:0, note:"Devido À  falta do detector de cintilação, somente os elementos do Fluor ao Cloro serão analisados.", created_at:datenow, updated_at:datenow}
      ]);    
  }
}

module.exports = GlobalSeeder
