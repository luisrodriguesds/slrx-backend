'use strict'

class ChangePassword {
  get rules () {
    return {
      // validation rules
      current_password: 'required',
      password: 'required|min:8|confirmed'
    }
  }

  get messages () {
    return {
      'current_password.required':'Campo senha atual é obrigatório',
      'password.required':'Campo nova senha obrigatório',
      'password.min':'Campo nova senha deve ter no mínimo 8 caracteres',
      'password.confirmed':'As senhas não correspondem',
    }
  }

  get validateAll () {
    return true
  }
}

module.exports = ChangePassword
