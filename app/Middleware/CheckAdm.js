'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class CheckAdm {

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle ({ request, auth, response }, next) {
    // call next to advance the request
    if (auth.user.access_level_slug != 'administrador' || auth.user.access_level_slug != 'operador') {
    	return response.status(200).json({message:"Usuário não autorizado.", error: true});
    }
    
    await next()
  }
}

module.exports = CheckAdm
