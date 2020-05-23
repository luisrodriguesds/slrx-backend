'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Database    = use('Database');
const Menu        = use('App/Models/Menu');
const AccessLevel = use('App/Models/AccessLevel');
const MenuAccess  = use('App/Models/MenuAccess');

/**
 * Resourceful controller for interacting with menus
 */
class MenuController {
  /**
   * Show a list of all menus.
   * GET menus
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
  }


  /**
   * Create/save a new menu.
   * POST menus
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single menu.
   * GET menus/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, auth, response }) {
    try {
			await auth.check();
		} catch (error) {
			return response.status(406).json({message:"Usuário não está logado", error:true});
    }
    const access = auth.user.access_level_slug;
    
    //Check if exist
    let typeUser = await AccessLevel.query().fetch();
        typeUser = JSON.parse(JSON.stringify(typeUser));

    const check = typeUser.filter(tp => tp.name_slug == access);
    if (check.length == 0) {
      return response.status(406).json({message:"Nível de acesso não encontrado.", error:true});
    }

    //Buscar os menus de cada tipo de usuário
    //SELECT * FROM access_levels as a, menus as m, menu_accesses as ma WHERE a.name_slug = 'aluno' AND a.id = ma.access_id AND ma.menu_id = m.id;
    let  menuRaw = await Database.table({a:'access_levels',
                                         m:'menus', 
                                         ma:'menu_accesses'})
                                .select({menu_table_id:'m.id',
                                         name:'m.name',
                                         url:'m.url',
                                         section:'m.section',
                                         icon:'m.icon',
                                         menu_status:'m.status',
                                         
                                         name_access:'a.name',
                                         name_slug_access:'a.name_slug',
                                         access_status:'a.status',
                                         })
                                .whereRaw('a.name_slug = ? AND a.id = ma.access_id AND ma.menu_id = m.id AND m.status = 1 AND a.status = 1', access);

    if (menuRaw == null) {
      return response.status(406).json({message:"Nível de acesso está desativado.", error:true});
    }

    //Isolate sections
    let section = menuRaw.map(menu => menu.section);
    let sections = section.filter((v,i) => section.indexOf(v) === i);
    
    //Mount Menu
    let i=0;
    let menu = sections.map((v) => {
      let itens = menuRaw.filter(item => item.section == v);
      i++;
      return {id:i, section:v, url:itens[0].url, icon:itens[0].icon, itens};
    });


    return menu;
  }

  /**
   * Update menu details.
   * PUT or PATCH menus/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a menu with id.
   * DELETE menus/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = MenuController
