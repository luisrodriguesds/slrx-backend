'use strict'

const Env = use('Env')
const Mail = use('Mail')

const UserHook = exports = module.exports = {}

UserHook.sendEmail = async (user) => {

  let buff, linkConfirm, linkNoConfirm

  buff = new Buffer(user.email); 
  linkConfirm = `${Env.get('APP_URL_PROD')}/api/user/confirm?email=${buff.toString('base64')}`;
  Mail.send('emails.confirmEmail', {name: user.name, linkConfirm}, (message) => {
    message
      .to(user.email)
      .from('<from-email>')
      .subject('SLRX - UFC | Confirmação de Cadastro')
  })

  switch (user.access_level_slug) {
    case 'aluno':
      //Envio de email ao professor vinculado para liberação está no hook ProfStudant
      break;
    case 'professor':
      //Envio de email ao responsável para liberação de professor está no hook academic
      break;
    case 'tecnico':
    case 'financeiro':
      //Envio de email ao responsável para liberação de professor está no hook company
      break;
    case 'autonomo':
      linkConfirm 		= `${Env.get('APP_URL_PROD')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
      linkNoConfirm 		= `${Env.get('APP_URL_PROD')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
      Mail.send('emails.freelanceConfirm', { linkConfirm, linkNoConfirm, name: user.name, email: user.email }, (message) => {
        message
          .to(Env.get('MAIL_RESPONSIBLE'))
          .from('<from-email>')
          .subject('SLRX - UFC | Confirmação de Cadastro de Autônomo')
      })
      break;
    default:
      break;
  }
  
}
