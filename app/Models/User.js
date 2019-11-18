'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')
const Env  = use('Env');

// Data format
const dateformat = use('dateformat');

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
  }

  // static get hidden () {
  //   return ['password']
  // }
  
  static get computed () {
    return ['permission', 'super_permission']
  }

  //Gettings and Settings
  getPhoto(photo){
    return `${Env.get('APP_URL_PROD')}/api/user/picture/${photo}`;
  }

  getBirthday(birthday){
    return dateformat(birthday, "yyyy-mm-dd");
  }

  getPermission({access_level_slug}){
    return ((access_level_slug == 'administrador') || (access_level_slug == 'operador')) ? true : false;
  }

  getSuperPermission({access_level_slug}){
    return ((access_level_slug == 'administrador')) ? true : false;
  }

  //Relacoes
  academic(){
    return this.hasOne('App/Models/AcademicDatum');
  }

  company () {
    return this.belongsToMany('App/Models/CompanyDatum').pivotTable('companies_users');
  }

  address(){
    return this.hasOne('App/Models/Address');
  }

  solicitations(){
    return this.hasMany('App/Models/Solicitation');
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
