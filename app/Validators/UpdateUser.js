'use strict'

class StoreUser {
  get rules () {
    return {
      // validation rules
      name: 'required',
      cpf: 'required|unique:users,cpf',
      birthday: 'required|date',
      sex: 'required|in:1,2',
      email: 'required|email|unique:users',
      state: 'required|min:2',
      city: 'required',
      phone1: 'required|min:9',
      level:'required|in:in:aluno,professor,empresa,operador,autonomo'
    }
  }

  get messages () {
    return {
      'name.required':'Campo name é obrigatório',
      'cpf.required':'Campo CPF é obrigatório',
      'cpf.unique':'Campo CPF - CPF já existente',
      'birthday.required':'Campo birthday é obrigatório',
      'birthday.date':'Campo birthday - Data inválida',
      'sex.required':'Campo sexo é obrigatório',
      'email.required':'Campo email é obrigatório',
      'email.email':'Campo email - email inválido',
      'email.unique':'Campo email - Email já existe',
      'state.required':'Campo estado é obrigatório',
      'state.min':'Campo estado - Formato Inválido',
      'city.required':'Campo cidade é obrigatório',
      'phone1.required':'Campo fone é obrigatório',
      'level.required':'Campo tipo - Informar o tipo de usuário',
      'level.in':'Campo tipo - Tipo inválido',
    }
  }

  get validateAll () {
    return true
  }
}

module.exports = StoreUser
