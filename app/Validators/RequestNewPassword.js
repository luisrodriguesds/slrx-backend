'use strict'

class NewPassword {
  get rules () {
    return {
      // validation rules
      email:'required|email'
    }
  }

  get messages () {
    return {
      'email.required':'Campo email é obrigatório',
      'email.email':'Email inválido',
    }
  }
}

module.exports = NewPassword
