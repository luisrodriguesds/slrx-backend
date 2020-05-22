'use strict'

class SetNewPassword {
  get rules () {
    return {
      // validation rules
      password:'required|confirmed|min:8',
      token: 'required'
    }
  }

  get messages () {
    return {
      'password.required':'Campo password é obrigatório',
      'password.confirmed':'As senhas não correspondem',
      'password.min':'A senha deve ter no mínimo 8 caracteres',
      'token.required':'Campo token é obrigatório'
    }
  }
}

module.exports = SetNewPassword
