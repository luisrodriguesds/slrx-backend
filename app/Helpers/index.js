'use strict'

const crypto  = use('crypto')
const User    = use('App/Models/User');
const Company = use('App/Models/CompanyDatum');
const Document= use('App/Models/Document')

/** Exemplo Function
 * Generate "random" alpha-numeric string.
 *
 * @param  {int}      length - Length of the string
 * @return {string}   The result
 */
const str_random = async (length = 40) => {
  let string = ''
  let len = string.length

  if (len < length) {
    let size = length - len
    let bytes = await crypto.randomBytes(size)
    let buffer = new Buffer(bytes)

    string += buffer
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substr(0, size)
  }

  return string
}

const getRandom = (max) => {
  return Math.floor(Math.random() * max + 1)
}

//Formatc money
const formatMoney = (numero) => {
  numero = parseFloat(numero);
  numero = numero.toFixed(2).split('.');
  numero[0] = numero[0].split(/(?=(?:...)*$)/).join('.');
  return numero.join(',');
}

//Formact Data para 15 de Outubro de 2019 entrando com new Date()
const formatDate = (date) => {
  var monthNames = [
    "Janeiro", "Fevereiro", "Março",
    "Abril", "Maio", "Junho", "Julho",
    "Agosto", "Setembro", "Outubro",
    "Novembro", "Dezembro"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return day + ' de ' + monthNames[monthIndex] + ' de ' + year;
}


/**
 * Numero do documento de proposta e ordem de seviço.
 * Pegar o user_id do tecnico ou financeiro e devolver o numero que será colocado no documento
 * no formato 0001/2019
 * 
 * @param  {user_id}      int - id do usuário
 * @return {string}   The result
 */
const doc_number = async (user_id) => {

  let doc = await Document.query().fetch();
      doc = conv(doc);
  let num = doc.length+1;
  
  if (num < 9) {
    num = `000${num}/${new Date().getFullYear()}`;
  }else if (num < 99) {
    num = `00${num}/${new Date().getFullYear()}`;    
  }
  
  return num;

}

const date_diff = (date) => {
  const date1     = new Date();
  const date2     = new Date(date);
  const timeDiff  = Math.abs(date2.getTime() - date1.getTime());
  const diffDays  = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return diffDays;
}

//Converter resultados vindo do banco em array
const conv = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

const studants = async (professor_id) =>{
    let studant;
    let professor = await ProfStudent.query().where('professor_id', professor_id).andWhere('status', 1).fetch();
    professor =  JSON.parse(JSON.stringify(professor));
    if (professor.length == 0) {
      return response.status(200).json([]);
    }

    let studant_id = []
    for (let i = 0; i < professor.length; i++) {
      studant_id.push(professor[i].studant_id);
    }

    studant_id = studant_id.join(',');

    studant = await User.query().whereRaw(`id IN (${studant_id})`).fetch();
    return studant;
}

module.exports = {
  str_random, 
  formatMoney,
  formatDate,
  doc_number,
  conv,
  date_diff,
  getRandom,
  studants
}