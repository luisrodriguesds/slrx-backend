'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')
/** Codificacao das senhas será o SHAR-1 **/
const jsSHA = use("jssha");

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {

        const shaObj = new jsSHA("SHA-1", "TEXT");
        shaObj.update(userInstance.password);
        // var _novaSenha = shaObj.getHash("HEX");
        userInstance.password = shaObj.getHash("HEX");
        // userInstance.password = await Hash.make(userInstance.password)
      }
    })
  }

  static get hidden () {
    return ['password']
  }

  //Relacoes
  academic(){
    return this.hasOne('App/Models/AcademicDatum');
  }

  company(){
    return this.hasOne('App/Models/CompanyDatum');
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens () {
    return this.hasMany('App/Models/Token')
  }
}

module.exports = User
