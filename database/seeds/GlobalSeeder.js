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
const Factory = use('Factory');
const Database = use('Database');
const dateformat = use('dateformat');

class GlobalSeeder {
  async run () {
    const datenow = dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
    // MENUS
    await Database.table('menus').insert([
    /*1*/{ name: 'Dashboard', url: '/dashboard', section:'Dashboard', icon:'fas fa-fire', created_at:datenow, updated_at:datenow},
    /*2*/{ name: 'Ver Arquivos', url: '/arquivos-uteis', section:'Arquivos Úteis', icon:'fas fa-file-alt', created_at:datenow, updated_at:datenow},
    /*3*/{ name: 'Enviar Arquivo', url: '/arquivos-uteis/enviar', section:'Arquivos Úteis', icon:'fas fa-file-alt', created_at:datenow, updated_at:datenow},
    /*4*/{ name: 'Todos os Equipamentos', url: '/equipamentos', section:'Equipamentos', icon:'fas fa-plug', created_at:datenow, updated_at:datenow},
    /*5*/{ name: 'Cadastrar Equipamento', url: '/equipamentos/cadastro', section:'Equipamentos', icon:'fas fa-plug', created_at:datenow, updated_at:datenow},
    /*6*/{ name: 'Todos os Usuários', url: '/usuarios', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*7*/{ name: 'Cadastrar Usuário', url: '/usuarios/cadastro', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*8*/{ name: 'Professores', url: '/usuarios/professores', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*9*/{ name: 'Alunos', url: '/usuarios/alunos', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*10*/{ name: 'Operadores', url: '/usuarios/operadores', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*11*/{ name: 'Empresas', url: '/usuarios/empresas', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*12*/{ name: 'Funcionarios de Empresa', url: '/usuarios/funcionarios', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*13*/{ name: 'Usuários Pendentes', url: '/usuarios/pendentes', section:'Usuários', icon:'far fa-user', created_at:datenow, updated_at:datenow},
    /*14*/{ name: 'Todas as Solicitações', url: '/solicitacoes', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
    /*15*/{ name: 'Cadastrar Solicitação', url: '/solicitacoes/cadastro', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
    /*16*/{ name: 'Abertas', url: '/solicitacoes/abertas', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
    /*17*/{ name: 'Concluídas', url: '/solicitacoes/concluidas', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
    /*18*/{ name: 'Tutoriais', url: '/solicitacoes/tutoriais', section:'Solicitações', icon:'fas fa-location-arrow', created_at:datenow, updated_at:datenow},
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

      //Professores
      { menu_id: 9, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 8, access_id: 7, created_at:datenow, updated_at:datenow},
    
      //Alunos
      { menu_id: 9, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 9, access_id: 7, created_at:datenow, updated_at:datenow},

      //Operadores
      { menu_id: 10, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 10, access_id: 7, created_at:datenow, updated_at:datenow},

      //Empresas
      { menu_id: 11, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 11, access_id: 7, created_at:datenow, updated_at:datenow},

      //Funcionarios de Empresa
      { menu_id: 12, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 12, access_id: 7, created_at:datenow, updated_at:datenow},

      //Usuários Pendentes
      { menu_id: 13, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 13, access_id: 7, created_at:datenow, updated_at:datenow},

      //Todas as Solicitações
      { menu_id: 14, access_id: 1, created_at:datenow, updated_at:datenow},
      { menu_id: 14, access_id: 2, created_at:datenow, updated_at:datenow},
      { menu_id: 14, access_id: 3, created_at:datenow, updated_at:datenow},
      { menu_id: 14, access_id: 4, created_at:datenow, updated_at:datenow},
      { menu_id: 14, access_id: 5, created_at:datenow, updated_at:datenow},
      { menu_id: 14, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 14, access_id: 7, created_at:datenow, updated_at:datenow},
      
      //Cadastrar Solicitação
      { menu_id: 15, access_id: 1, created_at:datenow, updated_at:datenow},
      { menu_id: 15, access_id: 2, created_at:datenow, updated_at:datenow},
      { menu_id: 15, access_id: 3, created_at:datenow, updated_at:datenow},
      { menu_id: 15, access_id: 4, created_at:datenow, updated_at:datenow},
      { menu_id: 15, access_id: 5, created_at:datenow, updated_at:datenow},
      { menu_id: 15, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 15, access_id: 7, created_at:datenow, updated_at:datenow},
      
      //Abertas
      { menu_id: 16, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 16, access_id: 7, created_at:datenow, updated_at:datenow},
      
      //Concluídas
      { menu_id: 17, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 17, access_id: 7, created_at:datenow, updated_at:datenow},
      
      //Tutoriais
      { menu_id: 18, access_id: 6, created_at:datenow, updated_at:datenow},
      { menu_id: 18, access_id: 7, created_at:datenow, updated_at:datenow},
      

      ]);
  }
}

module.exports = GlobalSeeder
