'use strict'

class StoreUsefulFile {
  get rules () {
    return {
      // validation rules
      name:'required|min:3',
      description:'required|min:3',
    }
  }

  get messages (){
    return {
      'name.required':'Campo nome está vazio',
      'name.min':'Campo nome com menos que 3 caracteres',
      'description.required':'Campo descrição está vazio',
      'description.min':'Campo descrição com menos que 3 caracteres',
    }
  }
}

module.exports = StoreUsefulFile
